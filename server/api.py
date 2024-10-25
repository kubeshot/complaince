from flask import Flask, request, send_file, jsonify
import io
from google.auth import default
from googleapiclient.discovery import build
from dotenv import load_dotenv
import os
from flask_cors import CORS  # Import CORS
import time
import re
import json



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


@app.route('/save_file', methods=['POST'])
def save_file():

    # Get the content from the request
    content = request.json.get('content')
    selected_profile = request.json.get('selectedProfile')
    resource = request.json.get('resource')

    print(content)

    if content is None:
        return jsonify({'error': 'No content provided'}), 400
    if selected_profile is None:
        return jsonify({'error': 'No profile specified'}), 400
    if resource is None:
        return jsonify({'error': 'No resource specified'}), 400

    # Define the file path
    # file_path = os.path.join('./controls/', 'compliance_control.rb')

    folder_path = os.path.join('./available-controls/', selected_profile)

    # Ensure the folder exists
    os.makedirs(folder_path, exist_ok=True)

    # Generate a unique filename using a timestamp to avoid overwriting
    file_name = f'{resource}.rb'  # Append timestamp to filename
    file_path = os.path.join(folder_path, file_name)

    # Write the content to the file
    with open(file_path, 'w') as file:
        file.write(content)


    # Write the content to the file
    with open(file_path, 'w') as file:
        file.write(content)

    return jsonify({'message': 'File saved successfully'}), 200


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
    

AVAILABLE_CONTROLS_DIR = 'available-controls'

@app.route('/api/create-folder', methods=['POST'])
def create_folder():
    # Get the profile name from the request JSON
    data = request.get_json()
    profile_name = data.get('profile_name', '').strip()

    if not profile_name:
        return jsonify({"error": "Profile name is required."}), 400

    # Define the folder path
    folder_path = os.path.join(AVAILABLE_CONTROLS_DIR, profile_name)

    # Check if the folder already exists
    if os.path.exists(folder_path):
        return jsonify({"error": "Folder already exists."}), 409

    try:
        # Create the new folder
        os.makedirs(folder_path)
        return jsonify({"message": f"Folder '{profile_name}' created successfully."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/fetch-folders', methods=['GET'])
def fetch_folders():
    try:
        # List all folders in the available-controls directory
        folder_names = [name for name in os.listdir(AVAILABLE_CONTROLS_DIR) if os.path.isdir(os.path.join(AVAILABLE_CONTROLS_DIR, name))]
        return jsonify(folder_names), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/fetch_files/<selected_profile>', methods=['GET'])
def fetch_files(selected_profile):
    # Define the directory path based on the selected profile
    folder_path = os.path.join('./available-controls/', selected_profile)

    try:
        # List all .rb files in the directory
        files = [f for f in os.listdir(folder_path) if f.endswith('.rb')]
        return jsonify({'files': files}), 200
    except FileNotFoundError:
        return jsonify({'error': 'Profile not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/fetch_ruby_file/<string:profile_name>/<string:file_name>', methods=['GET'])
def fetch_ruby_file(profile_name, file_name):
    try:
        # Construct the file path
        file_path = os.path.join( 'available-controls', profile_name, file_name)

        # Check if the file exists
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404

        # Read the content of the file
        with open(file_path, 'r') as file:
            content = file.read()

        # Return the content as a JSON response
        return jsonify({'content': content})

    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route('/save-control-json', methods=['POST'])
def save_control():
    data = request.get_json()

    # Extract the fields from the request
    conditions = data.get('conditions')
    resource = data.get('resource')
    selected_project = data.get('selectedProject')
    scope = data.get('scope')
    selected_profile = data.get('selectedProfile')

    # Specify the file path to save the JSON
    file_path = f'available-controls/{selected_profile}/data.json'

    # Initialize control data
    control_data = {
        'resource': resource,
        'scope': scope,
        'selectedProject': selected_project,
        'conditions': conditions,
    }

    # Load existing data if the file exists
    if os.path.exists(file_path):
        with open(file_path, 'r') as json_file:
            existing_data = json.load(json_file)
    else:
        existing_data = {}

    # Update or append control data
    if resource in existing_data:
        # Update existing resource
        existing_data[resource].update(control_data)
    else:
        # Append new resource
        existing_data[resource] = control_data

    # Save the updated data to the JSON file
    with open(file_path, 'w') as json_file:
        json.dump(existing_data, json_file, indent=4)

    return jsonify({"message": "Control data saved successfully!"}), 200

@app.route('/fetch-control-json', methods=['GET'])
def fetch_control():
    selected_profile = request.args.get('selectedProfile')  # Get the profile from query parameters

    if not selected_profile:
        return jsonify({"error": "No profile specified"}), 400

    # Define the file path based on the selected profile
    file_path = os.path.join('available-controls', selected_profile, 'data.json')

    if os.path.exists(file_path):
        with open(file_path, 'r') as json_file:
            data = json.load(json_file)
        return jsonify(data), 200
    else:
        return jsonify({"message": "No control data found for the specified profile."}), 404

    
if __name__ == '__main__':
    app.run(debug=True, port=5001)
