control 'control_1' do
  desc "Condition: google_projects.project_ids.each do |project_id|
  google_compute_firewalls(project: project_id).firewall_names.each do |firewall_name|
    describe "Firewall: #{firewall_name} in Project: #{project_id}" do
      it "should have correct " do
        firewall = google_compute_firewall(project: project_id, name: firewall_name)
        expect(firewall.).to eq ''
      end
    end
  end
end
"
end

