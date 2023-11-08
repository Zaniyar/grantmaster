# PR Activity Webhook

To assure that the crawler updates the db every time a change happens on a PR, be sure to install the `pr_activity_webhook.yml` action accordingly.

## Installation

### Prerequesites

- You have deployed the crawler and made it publicly accessible.
- You have the url ready.

### Install action

1. Copy the file to the repository to be monitored at .github/workflows/pr_activity_webhook.yml.
2. Replace the string "crawler-baseurl.com" with the actual base url at the "Call Webhook for PR events" action
    ```yml
    run: |
        curl -X GET "http://crawler-baseurl.com/api/crawler/run-single/$PR_NUMBER"
    ```
3. Commit and push the changes.

Now, every time there's activity on a pull request in the monitored repository, this action will make a POST request to the specified webhook URL.
