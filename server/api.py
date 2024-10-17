from flask import Flask, request, send_file, jsonify
import io
from google.auth import default
from googleapiclient.discovery import build
from dotenv import load_dotenv
import os
from flask_cors import CORS  # Import CORS

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for the Flask app

# Get organization_id from environment variable
organization_id = os.getenv("ORGANIZATION_ID")

def get_gcp_service():
    """Authenticate and return the Cloud Resource Manager API service using ADC."""
    credentials, project = default(scopes=['https://www.googleapis.com/auth/cloud-platform'])
    return build('cloudresourcemanager', 'v1', credentials=credentials)

@app.route('/generate_control', methods=['POST'])
def generate_control():
    try:
        data = request.json
        direction = data['direction']
        properties = data['properties']
        conditions = data['conditions']

        # Begin generating control file based on inputs
        control_content = f"""
control 'firewall-{properties['name']}-control' do
  title 'Firewall Control for {properties['name']}'
  desc 'Ensure the firewall follows the defined rules.'
  impact 1.0
  describe google_compute_firewall(project: '{properties['project_id']}', name: '{properties['name']}') do
    it {{ should exist }}
    it {{ should have_priority <= {properties['priority']} }}
"""

        if direction == 'INGRESS' and 'source_ranges' in properties:
            control_content += f"    it {{ should have_source_ranges '{properties['source_ranges']}' }}\n"
        elif direction == 'EGRESS' and 'destination_ranges' in properties:
            control_content += f"    it {{ should have_destination_ranges '{properties['destination_ranges']}' }}\n"

        # Add conditions dynamically
        for condition in conditions:
            if condition['condition'] == 'equals':
                control_content += f"    its('{condition['property']}') {{ should eq '{condition['value']}' }}\n"
            elif condition['condition'] == 'includes':
                control_content += f"    its('{condition['property']}') {{ should include '{condition['value']}' }}\n"
            elif condition['condition'] == 'less_than':
                control_content += f"    its('{condition['property']}') {{ should be < {condition['value']} }}\n"
            elif condition['condition'] == 'greater_than':
                control_content += f"    its('{condition['property']}') {{ should be > {condition['value']} }}\n"

        control_content += "  end\nend"

        return jsonify({"control_file": control_content})

    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/download_control', methods=['POST'])
def download_control():
    try:
        data = request.json
        control_file_content = data.get('control_file')

        if not control_file_content:
            return jsonify({"error": "No control file content found."}), 400

        buffer = io.BytesIO()
        buffer.write(control_file_content.encode('utf-8'))
        buffer.seek(0)

        return send_file(buffer, as_attachment=True, download_name='gcp_inspec_control.rb', mimetype='text/plain')
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400

from google.cloud import resourcemanager_v3

def get_all_folders(org_id):
    """Fetch all folders under the given organization."""
    client = resourcemanager_v3.FoldersClient()
    folders = []

    # List folders under the organization
    org_parent = f"organizations/{org_id}"
    request = resourcemanager_v3.ListFoldersRequest(parent=org_parent)
    for folder in client.list_folders(request=request):
        folders.append(folder.name)

    return folders

def get_all_projects(org_id):
    """Fetch all active projects under the organization and its folders."""
    client = resourcemanager_v3.ProjectsClient()
    projects = []

    # Fetch projects at the organization level
    org_parent = f"organizations/{org_id}"
    request = resourcemanager_v3.ListProjectsRequest(parent=org_parent)
    for project in client.list_projects(request=request):
        if project.state == resourcemanager_v3.Project.State.ACTIVE:
            projects.append({
                "project_id": project.project_id,
                "project_name": project.display_name
            })

    # Fetch projects at the folder level
    folders = get_all_folders(org_id)
    for folder in folders:
        folder_request = resourcemanager_v3.ListProjectsRequest(parent=folder)
        for project in client.list_projects(request=folder_request):
            if project.state == resourcemanager_v3.Project.State.ACTIVE:
                projects.append({
                    "project_id": project.project_id,
                    "project_name": project.display_name
                })

    return projects

@app.route('/api/projects', methods=['GET'])
def get_projects():
    try:
        active_projects = get_all_projects(organization_id)
        return jsonify({"projects": active_projects})

    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
if __name__ == '__main__':
    app.run(debug=True, port=5001)
