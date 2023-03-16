#!/usr/bin/python3

# status.py
#
# Various minor functions to work with the data from Google.
import argparse
import os
import sys

from dateutil import parser as dateparser

import keys.secrets as secrets


def cancel_task(tasks):
    import ee
    start_ee()

    for task in tasks.split(','):
        print('Canceling task {}'.format(task))
        ee.data.cancelTask(task)


def delete_file(file):
    # Download the file and move to the directory
    print("Deleting {}...".format(file['title']))
    file.Delete()


def download_file(directory, file):
    # Make sure the directory exists
    if not os.path.exists(directory):
        os.makedirs(directory)
    
    # Download the file and move to the directory
    sys.stdout.write("Downloading {}...".format(file['title']))
    sys.stdout.flush()
    file.GetContentFile(file['title'], mimetype = file['mimeType'])
    os.rename(file['title'], '{}/{}'.format(directory, file['title']))
    print("done!")


def list_files(directory, delete):
    # Start Google Drive
    drive = start_drive()

    # Get the list of files from Google Drive
    sys.stdout.write("Querying files...")
    sys.stdout.flush()
    files = drive.ListFile({'q': "'root' in parents and trashed=false"}).GetList()
    print("done!")

    # Process the files
    action = False
    for file in files:
        # Check if there are actions to perform first
        if directory is not None: 
            download_file(directory, file)
            action = True
        if delete is True:
            delete_file(file)
            action = True
                
        # Otherwise just display the file info
        if not action:
            print('{}  {: >6} MB  {}'.format(file['createdDate'], round(int(file['fileSize']) / 1e6, 2), file['title']))


def list_tasks(limit):
    PENDING = '\u001b[33m'
    SUCCESS = '\033[92m'
    ERROR = '\033[91m'
    CLEAR = '\033[0m'
    STATUS_CODE = '{}{: <9}{}'

    # Start the Earth Engine / Google Cloud connection
    import ee
    start_ee()
    
    # Counts of what's happening
    pending = 0; running = 0; finished = 0

    # List the operations
    count = 0
    for op in ee.data.listOperations():
        # Start the message string
        message = op['metadata']['description']

        # Parse the state specific items
        if 'error' in op:
            # Filter the data shown for cancelled jobs
            if 'Cancelled' in op['error']['message']:
                status = STATUS_CODE.format(ERROR, 'CANCELLED', CLEAR)
            else:
                status = STATUS_CODE.format(ERROR, 'ERROR', CLEAR)
                message += '\n' + ' '*22 + op['error']['message'].replace('\n', ' ')

            start = dateparser.parse(op['metadata']['createTime'])
            end = dateparser.parse(op['metadata']['endTime'])
            usage = (end - start).seconds
            
        else:
            state = op['metadata']['state']
            if state in ('PENDING', 'RUNNING'):
                code = PENDING
                if state == 'PENDING':
                    usage = 0         
                    pending += 1       
                if state == 'RUNNING':
                    start = dateparser.parse(op['metadata']['startTime'])
                    end = dateparser.parse(op['metadata']['updateTime'])
                    usage = (end - start).seconds
                    running += 1
            elif state == 'CANCELLING':
                code = ERROR
                end = dateparser.parse(op['metadata']['updateTime'])
                usage = (end - start).seconds
            else: 
                start = dateparser.parse(op['metadata']['startTime'])
                end = dateparser.parse(op['metadata']['endTime'])
                usage = (end - start).seconds
                message += ', {} EECU-seconds'.format(round(op['metadata']['batchEecuUsageSeconds'], 2))
                code = SUCCESS
                finished += 1
            status = STATUS_CODE.format(code, state, CLEAR)
            
        # Parse out the usage to get the approximate running time
        m, s = divmod(usage, 60)
        h, m = divmod(m, 60)
        time = '{:02d}:{:02d}:{:02d}'.format(int(h), int(m), int(s))        
        print('{} [{}]: {}, {}'.format(status, time, op['name'].split('/')[-1], message))

        # Break if we hit the limit
        count += 1
        if count > limit: break

    # Print the final stats
    print('\nSUMMARY : Running: {}, Pending: {}, Finished: {}'.format(running, pending, finished))


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
    if args.cancel:
        cancel_task(args.cancel)
    if args.files:
        list_files(args.directory, args.delete)
    if args.tasks:
        list_tasks(limit)


if __name__ == '__main__':
    # Parse the parameters
    parser = argparse.ArgumentParser()
    parser.add_argument('-c', action='store', dest='cancel', help='Cancel the given task')
    parser.add_argument('-d', action='store', dest='directory', help='Download files to the given directory')
    parser.add_argument('-f', action='store_true', dest='files', help='List the files stored with the service account')
    parser.add_argument('-l', action='store', dest='limit', default=sys.maxsize, help='Set a limit for the number of values returned')
    parser.add_argument('-t', action='store_true', dest='tasks', help='The status of tasks submitted to Earth Engine')
    parser.add_argument('--rm', action='store_true', dest='delete', help='Delete files stored with the service account')
    args = parser.parse_args()

    # Exit with help if there is nothing to do
    if not args.files and not args.tasks and not args.cancel:
        parser.print_help()
        sys.exit(0)
    
    main(args)