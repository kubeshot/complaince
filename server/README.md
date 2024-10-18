# Server

This directory contains the Flask server for the GCP InSpec Compliance project. The server provides APIs to generate InSpec controls for Google Cloud resources, including firewalls and storage buckets.

## Requirements

- Python 3.7 or higher
- Flask
- Flask-CORS
- Google Cloud SDK
- dotenv

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd server
   ```

2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up your environment variables:
   - Create a `.env` file in the `server` directory and add your Google Cloud credentials and organization ID:
     ```
     ORGANIZATION_ID=<your-organization-id>
     ```

## Running the Server

To start the Flask server, run:



# Example InSpec Profile For GCP

This example shows the implementation of an InSpec profile for GCP that depends on the [InSpec GCP Resource Pack](https://github.com/inspec/inspec-gcp).  See the [README](https://github.com/inspec/inspec-gcp) for instructions on setting up appropriate GCP credentials.

##  Create a profile

```
$ inspec init profile --platform gcp my-profile
Create new profile at /Users/spaterson/my-profile
 * Create directory libraries
 * Create file README.md
 * Create directory controls
 * Create file controls/example.rb
 * Create file inspec.yml
 * Create file inputs.yml
 * Create file libraries/.gitkeep

```

## Update `inputs.yml` to point to your project

```
gcp_project_id: 'my-gcp-project'
```

## Run the tests

```
$ cd gcp-profile/
$ inspec exec . -t gcp:// --input-file=inputs.yml

Profile: GCP InSpec Profile (my-profile)
Version: 0.1.0
Target:  gcp://local-service-account@my-gcp-project.iam.gserviceaccount.com

  ✔  gcp-single-region-1.0: Ensure single region has the correct properties.
     ✔  Region europe-west2 zone_names should include "europe-west2-a"
  ✔  gcp-regions-loop-1.0: Ensure regions have the correct properties in bulk.
     ✔  Region asia-east1 should be up
     ✔  Region asia-northeast1 should be up
     ✔  Region asia-south1 should be up
     ✔  Region asia-southeast1 should be up
     ✔  Region australia-southeast1 should be up
     ✔  Region europe-north1 should be up
     ✔  Region europe-west1 should be up
     ✔  Region europe-west2 should be up
     ✔  Region europe-west3 should be up
     ✔  Region europe-west4 should be up
     ✔  Region northamerica-northeast1 should be up
     ✔  Region southamerica-east1 should be up
     ✔  Region us-central1 should be up
     ✔  Region us-east1 should be up
     ✔  Region us-east4 should be up
     ✔  Region us-west1 should be up
     ✔  Region us-west2 should be up


Profile: Google Cloud Platform Resource Pack (inspec-gcp)
Version: 0.5.0
Target:  gcp://local-service-account@my-gcp-project.iam.gserviceaccount.com

     No tests executed.

Profile Summary: 2 successful controls, 0 control failures, 0 controls skipped
Test Summary: 18 successful, 0 failures, 0 skipped
```
