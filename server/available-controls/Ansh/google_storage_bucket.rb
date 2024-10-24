control 'control_1' do
  desc "Condition: google_projects.project_ids.each do |project_id|
  google_storage_buckets(project: project_id).bucket_names.each do |bucket_name|
    describe "Bucket: #{bucket_name} in Project: #{project_id}" do
      it "should have correct name" do
        bucket = google_storage_bucket(project: project_id, name: bucket_name)
        expect(bucket.name).to eq 'test'
      end
      it "should have correct location" do
        bucket = google_storage_bucket(project: project_id, name: bucket_name)
        expect(bucket.location).to eq 'US'
      end
    end
  end
end
"
end

