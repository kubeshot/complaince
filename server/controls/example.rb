# # copyright: 2018, The Authors

# title "Sample Section"

# gcp_project_id = input("gcp_project_id")

# # you add controls here
# control "gcp-single-region-1.0" do                                                    # A unique ID for this control
#   impact 1.0                                                                          # The criticality, if this control fails.
#   title "Ensure single region has the correct properties."                            # A human-readable title
#   desc "An optional description..."
#   describe google_compute_region(project: gcp_project_id, name: "europe-west2") do    # The actual test
#     its("zone_names") { should include "europe-west2-a" }
#   end
# end

# # plural resources can be leveraged to loop across many resources
# control "gcp-regions-loop-1.0" do                                                     # A unique ID for this control
#   impact 1.0                                                                          # The criticality, if this control fails.
#   title "Ensure regions have the correct properties in bulk."                         # A human-readable title
#   desc "An optional description..."
#   google_compute_regions(project: gcp_project_id).region_names.each do |region_name|  # Loop across all regions by name
#     describe google_compute_region(project: gcp_project_id, name: region_name) do     # The test for a single region
#       it { should be_up }
#     end
#   end
# end

title 'Loop over all GCP projects and look at firewalls in INGRESS direction'

control 'gcp-firewalls-all-projects' do
  impact 1.0
  title 'Ensure INGRESS firewalls in all projects have the correct properties'

  google_projects.project_ids.each do |project_id|
    google_compute_firewalls(project: project_id).firewall_names.each do |firewall_name|
      describe "Firewall: #{firewall_name} in Project: #{project_id}" do
        it "should have correct direction" do
          firewall = google_compute_firewall(project: project_id, name: firewall_name)
          expect(firewall.direction).to eq 'INGRESS'
        end

        it "should have correct priority" do
          firewall = google_compute_firewall(project: project_id, name: firewall_name)
          expect(firewall.priority).to cmp <= 1000
        end

        it "should have correct source ranges" do
          firewall = google_compute_firewall(project: project_id, name: firewall_name)
          expect(firewall.source_ranges).to include '0.0.0.0/0'
        end
      end
    end
  end
end

title 'Ensure the default network does not exist in a project'

gcp_project_id = input('gcp_project_id')
cis_version = input('cis_version')
cis_url = input('cis_url')
control_id = '3.1'
control_abbrev = 'networking'

control "cis-gcp-#{control_id}-#{control_abbrev}" do
  impact 'medium'

  title "[#{control_abbrev.upcase}] Ensure the default network does not exist in a project"

  desc 'To prevent use of default network, a project should not have a default network.'
  desc 'rationale', 'The default network has automatically created firewall rules and has pre-fabricated network configuration. Based on your security and networking requirements, you should create your network and delete the default network.'

  tag cis_scored: true
  tag cis_level: 2
  tag cis_gcp: control_id.to_s
  tag cis_version: cis_version.to_s
  tag project: gcp_project_id.to_s
  tag nist: ['CM-6']

  ref 'CIS Benchmark', url: cis_url.to_s
  ref 'GCP Docs', url: 'https://cloud.google.com/compute/docs/networking#firewall_rules'
  ref 'GCP Docs', url: 'https://cloud.google.com/compute/docs/reference/latest/networks/insert'
  ref 'GCP Docs', url: 'https://cloud.google.com/compute/docs/reference/latest/networks/delete'

  describe "[#{gcp_project_id}] Subnets" do
    subject { google_compute_networks(project: gcp_project_id) }
    its('network_names') { should_not include 'default' }
  end
end