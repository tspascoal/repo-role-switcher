# repo-role-switcher

> A GitHub App built with [Probot](https://github.com/probot/probot) that performs two functions:

- When a repository is created, it adds a (configurable) team to the repository with a given role (built in or custom)
- When a user or team is added to a repository (or role is changed) to a certain role it automatically changes it to another (effectively upgrading or downgrading a role).

> *Warning*
> This **is just a sample** and it's not production ready code. For simplicity it doesn't has error handle and doesn't handle rate limits.

> *Note*
> This is the worst named application in the world.

## Configuration

The app is configured with the following environment variables:

- `ROLE_TO_SWITCH` - The role to switch (e.g. `maintainer`). Default value is `mantain`.
- `ROLE_TO_SWITCH_TO` - The role to switch to (e.g. `admin`). Default value is `mantain-plus`.
- `ADD_TEAM_SLUG` - The team to add to the newly created repository (e.g. `my-team`). Default value is `security-alerts-team`.

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm run build
npm start
```

## Docker

```sh
# 1. Build container
npm run build
docker build -t repo-role-switcher .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> repo-role-switcher
```

## License

[ISC](LICENSE) © 2023 Tiago Pascoal
