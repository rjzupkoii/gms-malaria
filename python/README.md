# Setup

The following walk through was written using the Windows Subsystem for Linux running Ubuntu and will result in the [gCloud CLI client](https://cloud.google.com/sdk/docs/install) and [Earth Engine Python API client](https://developers.google.com/earth-engine/guides/python_install) being installed.

At the time that this walk through was written (2023-01-18) the `gcloud` CLI handles the authentication of Earth Engine, so the command `earthengine authenticate` should not be needed for a clean install.

Starting with the the same directory as this file in the `bash` console:

```bash
# Install the Python dependencies
pip install google-api-python-client
pip install -r requirements.txt

# Verify that dependencies are in place
sudo apt-get update
sudo apt-get install apt-transport-https ca-certificates gnupg

# Add the gCloud CLI distribution URI a a package source
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list

# Import the Google Cloud public key
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -

# Update and install the gCloud CLI
sudo apt-get update && sudo apt-get install google-cloud-cli

# Continue configuration of gCloud CLI
gcloud init
```
