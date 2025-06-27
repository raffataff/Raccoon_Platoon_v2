# Gemini Customizations for Raccoon_Platoon

This file allows you to customize the Gemini agent's behavior for this project.

## Project Setup

### Excluded Directories

To speed up file searches and focus on relevant code, you can exclude directories. It looks like this project has a lot of assets, so we've excluded the `assets` and `gimp` directories by default.

```json
{
  "tools": {
    "file_discovery": {
      "exclude": [
        "assets/",
        "gimp/"
      ]
    }
  }
}
```

## Custom Commands

You can define custom commands (aliases) to run common tasks. Since there is no `package.json` in this project, we are not sure about the commands to run. Here are some examples you can adapt.

### Running the game

To run the game, you might need a simple web server. If you have Python installed, you can use its built-in server.

```json
{
  "tools": {
    "shell": {
      "aliases": {
        "run": "python -m http.server 8000"
      }
    }
  }
}
```
You can then run the game by typing `run` in the chat.

### Other common tasks

You can add other aliases for tasks like linting or testing, if you have those set up.

```json
{
  "tools": {
    "shell": {
      "aliases": {
        "lint": "eslint js/",
        "test": "npm test"
      }
    }
  }
}
```

## User Preferences

You can also save personal preferences here.

```json
{
    "user": {
        "name": "User"
    }
}
```
This is just a starting point. Feel free to customize this file to fit your needs!
