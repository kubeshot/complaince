"use client"

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, MinusCircle } from 'lucide-react'

export function InspecComplianceComponent() {
  const [resource, setResource] = useState('')
  const [scope, setScope] = useState('all')
  const [selectedProject, setSelectedProject] = useState('')
  const [conditions, setConditions] = useState([{ property: '', operator: 'Equals', value: '' }])
  const [controlStrings, setControlStrings] = useState([])
  const [projects, setProjects] = useState([])

  const [loading, setLoading] = useState(false);

  const resources = ['google_compute_firewall', 'google_compute_zone', 'google_storage_bucket', 'google_compute_global_address']

  // const propertiesByResource = {
  //   google_compute_firewall: ['direction', 'priority', 'source_ranges', 'network', 'target_tags', 'allowed', 'denied', 'disabled', 'destination_ranges', 'log_config', 'source_tags', 'source_service_accounts', 'target_service_accounts', 'creation_timestamp', 'description', 'id', 'name'],
  //   google_compute_instance: ['machine_type', 'status', 'tags', 'zone', 'disks'],
  //   google_storage_bucket: ['location', 'storage_class', 'public_access_prevention'],
  // }

  const operators = ['Equals', 'Not Equals', 'Greater Than', 'Less Than', 'Contains', 'Does Not Contain']

  useEffect(() => {
    setLoading(true);
    axios.get('http://localhost:5001/api/projects')
      .then(response => {
        setLoading(false);
        setProjects(response.data.projects)
      })
      .catch(error => {
        setLoading(false)
        console.error('Error fetching projects:', error)
      })
  }, [])

  const addCondition = () => {
    setConditions([...conditions, { property: '', operator: 'Equals', value: '' }])
  }

  const deleteCondition = (index) => {
    if (conditions.length > 1) {
      const newConditions = conditions.filter((_, i) => i !== index)
      setConditions(newConditions)
    }
  }

  // const handleConditionChange = (index, field, value) => {
  //   const newConditions = [...conditions]
  //   newConditions[index][field] = value
  //   setConditions(newConditions)
  // }

  const handleConditionChange = (index, field, value, config) => {
    const newConditions = [...conditions];

    // If the user changes the property, reset the operator and value
    if (field === 'property') {
      const selectedProperty = value; // New property selected
      const propertyConfig = config[selectedProperty];

      newConditions[index] = {
        property: selectedProperty,
        operator: propertyConfig?.operator || 'Equals', // Reset operator to default for the new property
        value: propertyConfig?.allowedValues ? propertyConfig.allowedValues[0] : '', // Reset value based on new property
      };
    } else if (field === 'value' && newConditions[index].property === 'priority') {
      // Handle priority validation
      const numericValue = parseInt(value, 10);
      if (isNaN(numericValue) || numericValue < 0 || numericValue > 65535) {
        alert('Priority must be an integer between 0 and 65535');
        return;
      } else {
        newConditions[index][field] = numericValue;
      }
    }


    else {
      // If any other field is being updated, just update the specific field
      newConditions[index][field] = value;
    }

    setConditions(newConditions);
  };



  // firewall properties
  const firewallPropertiesConfig = {
    direction: {
      allowedValues: ['INGRESS', 'EGRESS'],
      operator: 'Equals', // Default operator for direction
      inputType: 'dropdown', // Type of input (dropdown)
    },
    ip_protocol: {
      allowedValues: ['tcp', 'udp', 'icmp', 'esp', 'ah', 'sctp', 'ipip', 'all'],
      inputType: 'dropdown',
      operator: 'Equals'
    },
    ports: {
      dependsOn: 'ip_protocol', // Only visible if ip_protocol is 'tcp' or 'udp'
      inputType: 'text', // Ports are a list or range in text form
      validation: {
        regex: /^[0-9\-]+$/, // Only allow numbers and hyphen for ranges
      },
    },
    description: {
      inputType: 'text',
    },
    priority: {
      inputType: 'number',
      validation: {
        min: 0,
        max: 65535,
      },
    },
    source_ranges: {
      inputType: 'text',
      validation: {
        // regex: /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/, // CIDR format
      },
    },
    destination_ranges: {
      inputType: 'text',
      validation: {
        // regex: /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/,
      },
    },
    disabled: {
      allowedValues: ['True', 'False'],
      inputType: 'dropdown',
      operator: 'Equals',
    },
    // log_config: {
    //   inputType: 'object', // Can be further expanded for nested fields
    // },
    // Additional properties can be added here...
  };

  const storageBucketConfig = {
    name: {
      inputType: 'text', // Name of the storage bucket
      validation: {
        required: true, // The name is mandatory
        regex: /^[a-z0-9-]+$/, // Example regex for bucket name validation
      },
      operator: 'Equals'
    },
    location: {
      inputType: 'dropdown', // Dropdown for bucket location
      allowedValues: ['US', 'EUROPE-WEST2', 'ASIA', 'REGIONAL', 'MULTI_REGIONAL'], // Example locations
      operator: 'Equals'
    },
    storage_class: {
      inputType: 'dropdown', // Dropdown for storage class
      allowedValues: [
        'MULTI_REGIONAL',
        'REGIONAL',
        'STANDARD',
        'NEARLINE',
        'COLDLINE',
        'ARCHIVE',
        'DURABLE_REDUCED_AVAILABILITY',
      ],
      operator: 'Equals'
    },
    project_number: {
      inputType: 'number', // Project number must be numeric
      validation: {
        required: true,
        min: 1, // Minimum valid project number
      },
    },
    labels: {
      inputType: 'object', // Key-value pairs for labels
      validation: {
        regex: /^[a-zA-Z0-9-_]+:[a-zA-Z0-9-_]+$/, // Example regex for key:value pairs
      },
    },
    retention_policy: {
      inputType: 'object', // Configuration for retention policy
      fields: {
        retention_period: {
          inputType: 'number', // Retention period in seconds
          validation: {
            min: 1, // Minimum retention period
          },
        },
        is_locked: {
          inputType: 'boolean', // Whether the retention policy is locked
        },
      },
    },
    logging: {
      inputType: 'object', // Logging configuration
      fields: {
        log_bucket: {
          inputType: 'text', // Destination bucket for logs
        },
        log_object_prefix: {
          inputType: 'text', // Prefix for log object names
        },
      },
    },
    encryption: {
      inputType: 'object', // Encryption configuration
      fields: {
        default_kms_key_name: {
          inputType: 'text', // KMS key name for encryption
        },
      },
    },

  };


  const zonePropertyConfig = {
    state: {
      inputType: 'dropdown',
      allowedValues: ['DEPRECATED', 'OBSOLETE', 'DELETED'],
      operator: 'Equals',
    },
    description: {
      inputType: 'text',
    },
    id: {
      inputType: 'number',
      operator: 'Equals',
      validation: {
        min: 1, // Ensure the ID is a positive number
      },
    },
    name: {
      inputType: 'text',
      validation: {
        required: true, // Name is mandatory
        regex: /^[a-z0-9-]+$/, // Example regex for valid names
      },
      operator: 'Equals',
    },
    status: {
      inputType: 'dropdown',
      allowedValues: ['UP', 'DOWN'],
      operator: 'Equals',
    },
    available_cpu_platforms: {
      inputType: 'text',
      operator: 'Contains', // Allow searching for specific platforms
    },
  };


  const globalAddressConfig = {
    address: {
      inputType: 'text', // Static external IP address
      validation: {
        required: true, // Address is mandatory
        regex: /^(?:\d{1,3}\.){3}\d{1,3}$/, // Basic validation for IPv4
      },
      operator: 'Equals',
    },

    description: {
      inputType: 'text', // Optional description
    },
    id: {
      inputType: 'number', // Unique identifier
      operator: 'Equals',
      validation: {
        required: true, // ID is mandatory
        min: 1, // Ensure the ID is a positive number
      },
    },
    name: {
      inputType: 'text', // Name of the resource
      validation: {
        required: true, // Name is mandatory
        regex: /^[a-z]([-a-z0-9]*[a-z0-9])?$/, // RFC1035 compliant regex
      },
      operator: 'Equals',
    },
    labels: {
      inputType: 'text', // Key-value pairs for labels
      validation: {
        regex: /^[a-zA-Z0-9-_]+:[a-zA-Z0-9-_]+$/, // Validation for key:value pairs
      },
    },

    ip_version: {
      inputType: 'dropdown', // IP version
      allowedValues: ['IPV4', 'IPV6'],
      operator: 'Equals',
    },

    
    address_type: {
      inputType: 'dropdown', // Type of address to reserve
      allowedValues: ['EXTERNAL', 'INTERNAL'],
      operator: 'Equals',
    },
    purpose: {
      inputType: 'dropdown', // Purpose of the resource
      allowedValues: ['VPC_PEERING', 'PRIVATE_SERVICE_CONNECT'],
      operator: 'Equals',
    },

  };







  const generateControlString = () => {
    let controlString = ''
    if (resource === 'google_compute_firewall') {
      if (scope === 'all') {
        controlString = `google_projects.project_ids.each do |project_id|\n  google_compute_firewalls(project: project_id).firewall_names.each do |firewall_name|\n`
      } else {
        controlString = `google_compute_firewalls(project: "${selectedProject}").firewall_names.each do |firewall_name|\n`
      }

      controlString += `    describe "Firewall: #{firewall_name} in Project: #{project_id}" do\n`

      conditions.forEach((condition) => {
        const { property, operator, value } = condition

        controlString += `      it "should have correct ${property}" do\n`
        controlString += `        firewall = google_compute_firewall(project: ${scope === 'all' ? 'project_id' : `"${selectedProject}"`}, name: firewall_name)\n`

        let expectation = ''
        switch (operator) {
          case 'Equals':
            expectation = `expect(firewall.${property}).to eq '${value}'`
            break
          case 'Not Equals':
            expectation = `expect(firewall.${property}).not_to eq '${value}'`
            break
          case 'Greater Than':
            expectation = `expect(firewall.${property}).to be > ${value}`
            break
          case 'Less Than':
            expectation = `expect(firewall.${property}).to be < ${value}`
            break
          case 'Contains':
            expectation = `expect(firewall.${property}).to include '${value}'`
            break
          case 'Does Not Contain':
            expectation = `expect(firewall.${property}).not_to include '${value}'`
            break
          default:
            expectation = `expect(firewall.${property}).to eq '${value}'`
        }
        controlString += `        ${expectation}\n`
        controlString += '      end\n'
      })

      controlString += '    end\n'
      if (scope === 'all') controlString += '  end\nend\n'
    } else if (resource === 'google_storage_bucket') {
      if (scope === 'all') {
        controlString = `google_projects.project_ids.each do |project_id|\n  google_storage_buckets(project: project_id).bucket_names.each do |bucket_name|\n`
      } else {
        controlString = `google_storage_buckets(project: "${selectedProject}").bucket_names.each do |bucket_name|\n`
      }

      controlString += `    describe "Bucket: #{bucket_name} in Project: #{project_id}" do\n`



      conditions.forEach((condition) => {
        const { property, operator, value } = condition

        controlString += `      it "should have correct ${property}" do\n`
        controlString += `        bucket = google_storage_bucket(project: ${scope === 'all' ? 'project_id' : `"${selectedProject}"`}, name: bucket_name)\n`

        let expectation = ''
        switch (operator) {
          case 'Equals':
            expectation = `expect(bucket.${property}).to eq '${value}'`
            break
          case 'Not Equals':
            expectation = `expect(bucket.${property}).not_to eq '${value}'`
            break
          case 'Greater Than':
            expectation = `expect(bucket.${property}).to be > ${value}`
            break
          case 'Less Than':
            expectation = `expect(bucket.${property}).to be < ${value}`
            break
          case 'Contains':
            expectation = `expect(bucket.${property}).to include '${value}'`
            break
          case 'Does Not Contain':
            expectation = `expect(bucket.${property}).not_to include '${value}'`
            break
          default:
            expectation = `expect(bucket.${property}).to eq '${value}'`
        }
        controlString += `        ${expectation}\n`
        controlString += '      end\n'
      })

      controlString += '    end\n'
      if (scope === 'all') controlString += '  end\nend\n'
    } else if (resource === 'google_compute_zone') {
      if (scope === 'all') {
        controlString = `google_projects.project_ids.each do |project_id|\n  google_compute_zones(project: project_id).zone_names.each do |zone_name|\n`;
      } else {
        controlString = `google_compute_zones(project: "${selectedProject}").zone_names.each do |zone_name|\n`;
      }

      controlString += `    describe "Zone: #{zone_name} in Project: #{project_id}" do\n`;

      conditions.forEach((condition) => {
        const { property, operator, value } = condition;

        controlString += `      it "should have correct ${property}" do\n`;
        controlString += `        zone = google_compute_zone(project: ${scope === 'all' ? 'project_id' : `"${selectedProject}"`}, name: zone_name)\n`;

        let expectation = '';
        switch (operator) {
          case 'Equals':
            expectation = `expect(zone.${property}).to eq '${value}'`;
            break;
          case 'Not Equals':
            expectation = `expect(zone.${property}).not_to eq '${value}'`;
            break;
          case 'Greater Than':
            expectation = `expect(zone.${property}).to be > ${value}`;
            break;
          case 'Less Than':
            expectation = `expect(zone.${property}).to be < ${value}`;
            break;
          case 'Contains':
            expectation = `expect(zone.${property}).to include '${value}'`;
            break;
          case 'Does Not Contain':
            expectation = `expect(zone.${property}).not_to include '${value}'`;
            break;
          default:
            expectation = `expect(zone.${property}).to eq '${value}'`;
        }
        controlString += `        ${expectation}\n`;
        controlString += '      end\n';
      });

      controlString += '    end\n';
      if (scope === 'all') controlString += '  end\nend\n';
    } else if (resource === 'google_compute_global_address') {
      if (scope === 'all') {
        controlString = `google_projects.project_ids.each do |project_id|\n  google_compute_global_addresses(project: project_id).global_address_names.each do |address_name|\n`;
      } else {
        controlString = `google_compute_global_addresses(project: "${selectedProject}").global_address_names.each do |address_name|\n`;
      }

      controlString += `    describe "Global Address: #{address_name} in Project: #{project_id}" do\n`;

      conditions.forEach((condition) => {
        const { property, operator, value } = condition;

        controlString += `      it "should have correct ${property}" do\n`;
        controlString += `        address = google_compute_global_address(project: ${scope === 'all' ? 'project_id' : `"${selectedProject}"`}, name: address_name)\n`;

        let expectation = '';
        switch (operator) {
          case 'Equals':
            expectation = `expect(address.${property}).to eq '${value}'`;
            break;
          case 'Not Equals':
            expectation = `expect(address.${property}).not_to eq '${value}'`;
            break;
          case 'Greater Than':
            expectation = `expect(address.${property}).to be > ${value}`;
            break;
          case 'Less Than':
            expectation = `expect(address.${property}).to be < ${value}`;
            break;
          case 'Contains':
            expectation = `expect(address.${property}).to include '${value}'`;
            break;
          case 'Does Not Contain':
            expectation = `expect(address.${property}).not_to include '${value}'`;
            break;
          default:
            expectation = `expect(address.${property}).to eq '${value}'`;
        }
        controlString += `        ${expectation}\n`;
        controlString += '      end\n';
      });

      controlString += '    end\n';
      if (scope === 'all') controlString += '  end\nend\n';
    }


    setControlStrings([...controlStrings, controlString])
  }

  const generateRubyContent = () => {
    let rubyFileContent = '';

    controlStrings.forEach((control, index) => {
      rubyFileContent += `control 'control_${index + 1}' do\n`;
      rubyFileContent += `  desc "Condition: ${control}"\n`;
      // Additional formatting can be added if needed
      rubyFileContent += "end\n\n";
    });

    return rubyFileContent;
  };

  // Function to save Ruby file
  // const saveRubyFile = (content: string) => {
  //   const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = 'compliance_control.rb';
  //   a.click();
  //   URL.revokeObjectURL(url);
  // };


  const saveRubyFile = async (content: string) => {
    console.log("saving file")
    try {
      const response = await fetch('http://localhost:5001/save_file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log(data.message); // Log success message
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  const handleGenerateRubyFile = () => {
    const rubyContent = generateRubyContent();
    saveRubyFile(rubyContent);
  };



  // Function to render a condition for google_compute_firewall
  const renderFirewallCondition = (condition, index,) => {
    const propertyConfig = firewallPropertiesConfig[condition.property];

    const validateValue = (value) => {

      if (value === "") return true;

      if (propertyConfig?.validation?.regex) {
        // alert('Please check the value you have enter.');
        return propertyConfig.validation.regex.test(value);
      }
      return true; // If no regex, assume valid
    };

    return (
      <div key={index} className="flex items-center space-x-2">
        {/* Property Selection */}
        <Select
          value={condition.property}
          onValueChange={(value) => handleConditionChange(index, 'property', value, firewallPropertiesConfig)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Property" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(firewallPropertiesConfig).map((prop) => (
              <SelectItem key={prop} value={prop}>
                {prop}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Operator Selection */}
        <Select
          value={condition.operator}
          onValueChange={(value) => handleConditionChange(index, 'operator', value, firewallPropertiesConfig)}
          disabled={propertyConfig?.operator}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Operator" />
          </SelectTrigger>
          <SelectContent>
            {operators.map((op) => (
              <SelectItem key={op} value={op}>
                {op}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Value Field based on Property */}
        {propertyConfig?.inputType === 'number' ? (
          <Input
            value={condition.value}
            onChange={(e) => { validateValue(e.target.value) ? handleConditionChange(index, 'value', e.target.value, firewallPropertiesConfig) : alert('Please check the value you have enter.') }}
            placeholder={`Enter ${condition.property}`}
            type="number"
            min={propertyConfig.validation?.min}
            max={propertyConfig.validation?.max}
            className={validateValue(condition.value) ? '' : 'border-red-500'} // Add validation feedback
          />
        ) : propertyConfig?.inputType === 'dropdown' ? (
          <Select
            value={condition.value}
            onValueChange={(value) => handleConditionChange(index, 'value', value, firewallPropertiesConfig)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${condition.property}`} />
            </SelectTrigger>
            <SelectContent>
              {propertyConfig.allowedValues.map((val) => (
                <SelectItem key={val} value={val}>
                  {val}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={condition.value}
            onChange={(e) => { validateValue(e.target.value) ? handleConditionChange(index, 'value', e.target.value, firewallPropertiesConfig) : alert('Please check the value you have enter.') }}
            placeholder={`Enter ${condition.property}`}
            className={validateValue(condition.value) ? '' : 'border-red-500'} // Add validation feedback
          />
        )}

        {/* Add or Remove Condition */}
        <Button variant="outline" size="icon" onClick={addCondition}>
          <PlusCircle className="h-4 w-4" />
        </Button>
        {conditions.length > 1 && (
          <Button variant="outline" size="icon" onClick={() => deleteCondition(index)}>
            <MinusCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };



  // Function to render a condition for google_storage_bucket
  const renderBucketCondition = (condition, index) => {
    const propertyConfig = storageBucketConfig[condition.property];

    const validateValue = (value) => {
      if (propertyConfig?.validation?.regex) {
        return propertyConfig.validation.regex.test(value);
      }
      return true; // If no regex, assume valid
    };

    return (
      <div key={index} className="flex items-center space-x-2">
        {/* Property Selection */}
        <Select
          value={condition.property}
          onValueChange={(value) => handleConditionChange(index, 'property', value, storageBucketConfig)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Property" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(storageBucketConfig).map((prop) => (
              <SelectItem key={prop} value={prop}>
                {prop}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Operator Selection */}
        <Select
          value={condition.operator}
          onValueChange={(value) => handleConditionChange(index, 'operator', value, storageBucketConfig)}
          disabled={propertyConfig?.operator}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Operator" />
          </SelectTrigger>
          <SelectContent>
            {operators.map((op) => (
              <SelectItem key={op} value={op}>
                {op}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Value Field based on Property */}
        {propertyConfig?.inputType === 'dropdown' ? (
          <Select
            value={condition.value}
            onValueChange={(value) => handleConditionChange(index, 'value', value, storageBucketConfig)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${condition.property}`} />
            </SelectTrigger>
            <SelectContent>
              {propertyConfig.allowedValues.map((val) => (
                <SelectItem key={val} value={val}>
                  {val}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : propertyConfig?.inputType === 'number' ? (
          <Input
            value={condition.value}
            onChange={(e) => handleConditionChange(index, 'value', e.target.value, storageBucketConfig)}
            placeholder={`Enter ${condition.property}`}
            type="number"
            min={propertyConfig.validation?.min}
            className={validateValue(condition.value) ? '' : 'border-red-500'} // Add validation feedback
          />
        ) : (
          <Input
            value={condition.value}
            onChange={(e) => handleConditionChange(index, 'value', e.target.value, storageBucketConfig)}
            placeholder={`Enter ${condition.property}`}
            className={validateValue(condition.value) ? '' : 'border-red-500'} // Add validation feedback
          />
        )}

        {/* Add or Remove Condition */}
        <Button variant="outline" size="icon" onClick={addCondition}>
          <PlusCircle className="h-4 w-4" />
        </Button>
        {conditions.length > 1 && (
          <Button variant="outline" size="icon" onClick={() => deleteCondition(index)}>
            <MinusCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };


  // Function to render a condition for google_compute_zone
  const renderZoneCondition = (condition, index) => {
    const propertyConfig = zonePropertyConfig[condition.property];

    const validateValue = (value) => {
      if (value === "") return true; // Allow empty input

      if (propertyConfig?.validation?.regex) {
        return propertyConfig.validation.regex.test(value);
      }
      return true; // If no regex, assume valid
    };

    return (
      <div key={index} className="flex items-center space-x-2">
        {/* Property Selection */}
        <Select
          value={condition.property}
          onValueChange={(value) => handleConditionChange(index, 'property', value, zonePropertyConfig)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Property" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(zonePropertyConfig).map((prop) => (
              <SelectItem key={prop} value={prop}>
                {prop}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Operator Selection */}
        <Select
          value={condition.operator}
          onValueChange={(value) => handleConditionChange(index, 'operator', value, zonePropertyConfig)}
          disabled={propertyConfig?.operator}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Operator" />
          </SelectTrigger>
          <SelectContent>
            {operators.map((op) => (
              <SelectItem key={op} value={op}>
                {op}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Value Field based on Property */}
        {propertyConfig?.inputType === 'dropdown' ? (
          <Select
            value={condition.value}
            onValueChange={(value) => handleConditionChange(index, 'value', value, zonePropertyConfig)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${condition.property}`} />
            </SelectTrigger>
            <SelectContent>
              {propertyConfig.allowedValues.map((val) => (
                <SelectItem key={val} value={val}>
                  {val}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : propertyConfig?.inputType === 'number' ? (
          <Input
            value={condition.value}
            onChange={(e) => {
              const value = e.target.value;
              if (validateValue(value)) {
                handleConditionChange(index, 'value', value, zonePropertyConfig);
              } else {
                alert('Please check the value you have entered.');
              }
            }}
            placeholder={`Enter ${condition.property}`}
            type="number"
            min={propertyConfig.validation?.min}
            className={validateValue(condition.value) ? '' : 'border-red-500'} // Add validation feedback
          />
        ) : (
          <Input
            value={condition.value}
            onChange={(e) => {
              const value = e.target.value;
              if (validateValue(value)) {
                handleConditionChange(index, 'value', value, zonePropertyConfig);
              } else {
                alert('Please check the value you have entered.');
              }
            }}
            placeholder={`Enter ${condition.property}`}
            className={validateValue(condition.value) ? '' : 'border-red-500'} // Add validation feedback
          />
        )}

        {/* Add or Remove Condition */}
        <Button variant="outline" size="icon" onClick={addCondition}>
          <PlusCircle className="h-4 w-4" />
        </Button>
        {conditions.length > 1 && (
          <Button variant="outline" size="icon" onClick={() => deleteCondition(index)}>
            <MinusCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };


  const renderGlobalAddressCondition = (condition, index) => {
    const propertyConfig = globalAddressConfig[condition.property];

    const validateValue = (value) => {
      if (propertyConfig?.validation?.regex) {
        return propertyConfig.validation.regex.test(value);
      }
      return true; // If no regex, assume valid
    };

    return (
      <div key={index} className="flex items-center space-x-2">
        {/* Property Selection */}
        <Select
          value={condition.property}
          onValueChange={(value) => handleConditionChange(index, 'property', value, globalAddressConfig)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Property" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(globalAddressConfig).map((prop) => (
              <SelectItem key={prop} value={prop}>
                {prop}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Operator Selection */}
        <Select
          value={condition.operator}
          onValueChange={(value) => handleConditionChange(index, 'operator', value, globalAddressConfig)}
          disabled={propertyConfig?.operator}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Operator" />
          </SelectTrigger>
          <SelectContent>
            {operators.map((op) => (
              <SelectItem key={op} value={op}>
                {op}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Value Field based on Property */}
        {propertyConfig?.inputType === 'dropdown' ? (
          <Select
            value={condition.value}
            onValueChange={(value) => handleConditionChange(index, 'value', value, globalAddressConfig)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${condition.property}`} />
            </SelectTrigger>
            <SelectContent>
              {propertyConfig.allowedValues.map((val) => (
                <SelectItem key={val} value={val}>
                  {val}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : propertyConfig?.inputType === 'number' ? (
          <Input
            value={condition.value}
            onChange={(e) => {
              const value = e.target.value;
              if (validateValue(value)) {
                handleConditionChange(index, 'value', value, globalAddressConfig);
              } else {
                alert('Please check the value you have entered.');
              }
            }}
            placeholder={`Enter ${condition.property}`}
            type="number"
            min={propertyConfig.validation?.min}
            className={validateValue(condition.value) ? '' : 'border-red-500'} // Add validation feedback
          />
        ) : (
          <Input
            value={condition.value}
            onChange={(e) => {
              const value = e.target.value;
              if (validateValue(value)) {
                handleConditionChange(index, 'value', value, globalAddressConfig);
              } else {
                alert('Please check the value you have entered.');
              }
            }}
            placeholder={`Enter ${condition.property}`}
            className={validateValue(condition.value) ? '' : 'border-red-500'} // Add validation feedback
          />
        )}

        {/* Add or Remove Condition */}
        <Button variant="outline" size="icon" onClick={addCondition}>
          <PlusCircle className="h-4 w-4" />
        </Button>
        {conditions.length > 1 && (
          <Button variant="outline" size="icon" onClick={() => deleteCondition(index)}>
            <MinusCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };





  // Main component rendering conditions
  const renderConditions = (resource, conditions) => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Conditions</h3>
        {conditions.map((condition, index) => {
          if (resource === 'google_compute_firewall') {
            return renderFirewallCondition(condition, index);
          } else if (resource === 'google_storage_bucket') {
            return renderBucketCondition(condition, index);
          } else if (resource === 'google_compute_zone') {
            return renderZoneCondition(condition, index);
          } else if (resource === 'google_compute_global_address') {
            return renderGlobalAddressCondition(condition, index);
          }
          return null; // or some fallback UI
        })}
      </div>
    );
  };



  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Generate InSpec Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="resource">Select Resource</Label>
            <Select value={resource} onValueChange={setResource}>
              <SelectTrigger id="resource">
                <SelectValue placeholder="Select Resource" />
              </SelectTrigger>
              <SelectContent>
                {resources.map((res) => (
                  <SelectItem key={res} value={res}>
                    {res}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {resource && (
            <div className="space-y-2">
              <Label htmlFor="scope">Select Scope</Label>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger id="scope">
                  <SelectValue placeholder="Select Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="single">Single Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* {scope === 'single' &&  (
          <div className="space-y-2">
            <Label htmlFor="project">Select Project</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger id="project">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(projects) && projects.length > 0 ? (
                  projects.map((proj) => (
                    <SelectItem key={proj.project_id} value={proj.project_id}>
                      {proj.project_name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>No projects available.</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )} */}

        {scope === 'single' && (
          !loading ? (
            <div className="space-y-2">
              <Label htmlFor="project">Select Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(projects) && projects.length > 0 ? (
                    projects.map((proj) => (
                      <SelectItem key={proj.project_id} value={proj.project_id}>
                        {proj.project_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>No projects available.</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p>Loading...</p>
          )
        )}


        {resource && renderConditions(
          resource,
          conditions
        )}


      </CardContent>
      <div className='flex' >
        <CardFooter>
          <Button onClick={generateControlString}>Generate Control</Button>
        </CardFooter>
        {controlStrings.length > 0 &&
          <CardFooter>
            <Button onClick={handleGenerateRubyFile}>Generate Ruby file</Button>
          </CardFooter>}
      </div>

      {controlStrings.length > 0 && (
        <CardContent>
          <h3 className="text-lg font-semibold mb-2">Generated InSpec Controls:</h3>
          <div className="bg-gray-100 p-4 rounded-md overflow-x-auto">
            <pre className="text-sm">{controlStrings.join('\n\n')}</pre>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
