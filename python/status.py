#!/usr/bin/python3

# status.py
#
# Various minor functions to work with the data from Google.
import argparse
import sys

import keys.secrets as secrets

def list_files():
    # Start Google Drive
    drive = start_drive()

    # Get the list of files from Google Drive
    sys.stdout.write("Querying files...")
    sys.stdout.flush()
    files = drive.ListFile({'q': "'root' in parents and trashed=false"}).GetList()
    print("done!")

    # Display the list of files
    for file in files:
        print('{}\t{}\t{}'.format(file['createdDate'], file['fileSize'], file['title']))
        
        # TODO Finish writing the code to process the files
        if '.tif' in file['title']:
            file.GetContentFile(file['title'], mimetype="image/tiff")
            file.Delete()


def list_tasks(limit):
    PENDING = '\u001b[33m'
    SUCCESS = '\033[92m'
    ERROR = '\033[91m'
    CLEAR = '\033[0m'
    STATUS_CODE = '{}{: <9}{}'

    # Start the Earth Engine / Google Cloud connection
    import ee
    start_ee()
    
    # List the operations
    count = 0
    for op in ee.data.listOperations():
        if 'error' in op:
            status = STATUS_CODE.format(ERROR, 'ERROR', CLEAR)
            message = op['error']['message'].replace('\n', ' ')
            print('{}: {}, {}\n{}{}'.format(status, op['name'], op['metadata']['description'], ' '*11, message))
        else:
            state = op['metadata']['state']
            code = SUCCESS
            if state in ('PENDING', 'RUNNING'): code = PENDING
            status = STATUS_CODE.format(code, state, CLEAR)
            print('{}: {}, {}'.format(status, op['name'], op['metadata']['description']))

        # Break if we hit the limit
        count += 1
        if count > limit: break

def start_drive():
    from pydrive.auth import GoogleAuth
    from pydrive.drive import GoogleDrive
    from oauth2client.service_account import ServiceAccountCredentials

    SCOPE = ['https://www.googleapis.com/auth/drive']

    # Authenticate to Google Drive through the service account
    authenticate = GoogleAuth()
    authenticate.credentials = ServiceAccountCredentials.from_json_keyfile_name(secrets.KEY, scopes = SCOPE)
    return GoogleDrive(authenticate)


# Start Earth Engine and other Google services
def start_ee():
    sys.stdout.write("Initializing Earth Engine...")
    sys.stdout.flush()
    import ee
    credentials = ee.ServiceAccountCredentials(secrets.ACCOUNT, secrets.KEY)
    ee.Initialize(credentials)
    print("done!")


def main(args):
    limit = int(args.limit)
    if args.tasks:
        list_tasks(limit)
    if args.files:
        list_files()


if __name__ == '__main__':
    # Parse the parameters
    parser = argparse.ArgumentParser()
    parser.add_argument('-f', action='store_true', dest='files', help='List the files stored with the service account')
    parser.add_argument('-l', action='store', dest='limit', default=sys.maxsize, help='Set a limit for the number of values returned')
    parser.add_argument('-t', action='store_true', dest='tasks', help='The status of tasks')
    args = parser.parse_args()

    # Exit with help if there is nothing to do
    if not args.files and not args.tasks:
        parser.print_help()
        sys.exit(0)
    
    main(args)