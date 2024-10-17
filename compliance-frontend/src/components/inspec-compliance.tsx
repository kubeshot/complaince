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

  const resources = ['google_compute_firewall', 'google_compute_instance', 'google_storage_bucket']

  const propertiesByResource = {
    google_compute_firewall: ['direction', 'priority', 'source_ranges', 'network', 'target_tags'],
    google_compute_instance: ['machine_type', 'status', 'tags', 'zone', 'disks'],
    google_storage_bucket: ['location', 'storage_class', 'public_access_prevention'],
  }

  const operators = ['Equals', 'Not Equals', 'Greater Than', 'Less Than', 'Contains', 'Does Not Contain']

  useEffect(() => {
    axios.get('http://localhost:5001/api/projects')
      .then(response => {
        setProjects(response.data.projects)
      })
      .catch(error => {
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

  const handleConditionChange = (index, field, value) => {
    const newConditions = [...conditions]
    newConditions[index][field] = value
    setConditions(newConditions)
  }

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
      
      // Check for public access prevention
      controlString += `      it "should not be publicly accessible" do\n`
      controlString += `        bucket = google_storage_bucket(project: ${scope === 'all' ? 'project_id' : `"${selectedProject}"`}, name: bucket_name)\n`
      controlString += `        expect(bucket.public_access_prevention).to eq 'enforced'\n`  // Check for public access prevention

      // Additional checks for bucket properties
      controlString += `      it "should have the correct storage class" do\n`
      controlString += `        expect(bucket.storage_class).to eq 'STANDARD'\n`  // Example check for storage class
      controlString += '      end\n'

      controlString += `      it "should be located in the correct region" do\n`
      controlString += `        expect(bucket.location).to eq 'us-central1'\n`  // Example check for location
      controlString += '      end\n'

      controlString += '    end\n'
      if (scope === 'all') controlString += '  end\nend\n'
    }

    setControlStrings([...controlStrings, controlString])
  }

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

        {scope === 'single' && (
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
        )}

        {resource && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Conditions</h3>
            {conditions.map((condition, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Select value={condition.property} onValueChange={(value) => handleConditionChange(index, 'property', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Property" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertiesByResource[resource]?.map((prop) => (
                      <SelectItem key={prop} value={prop}>
                        {prop}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={condition.operator} onValueChange={(value) => handleConditionChange(index, 'operator', value)}>
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
                <Input
                  value={condition.value}
                  onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                  placeholder="Value"
                />
                <Button variant="outline" size="icon" onClick={addCondition}>
                  <PlusCircle className="h-4 w-4" />
                </Button>
                {conditions.length > 1 && (
                  <Button variant="outline" size="icon" onClick={() => deleteCondition(index)}>
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={generateControlString}>Generate Control</Button>
      </CardFooter>

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
