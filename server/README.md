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

