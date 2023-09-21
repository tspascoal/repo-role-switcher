import { Probot } from "probot";

const ROLE_TO_SWITCH = process.env["ROLE_TO_SWITCH"] || "maintain"
const ASSIGN_ROLE = process.env["ASSIGN_ROLE"] || "maintain-plus"
const ADD_TEAM_SLUG = process.env["ADD_TEAM_SLUG"] || "security-alerts-team"

// This application needs to be installed on ALL repositories. Otherwise it will not be able to add the team to
// the new repository nor change permissions on the repositories in general.

export = (app: Probot) => {

  app.log.info(`ROLE_TO_SWITCH: ${ROLE_TO_SWITCH}`)
  app.log.info(`ASSIGN_ROLE: ${ASSIGN_ROLE}`)
  app.log.info(`ADD_TEAM_SLUG: ${ADD_TEAM_SLUG}`)

  app.on("member", async (context) => {
    if (context.isBot) return;
    if (context.payload.action !== "added" && context.payload.action !== "edited") return;

    const member = context.payload.member

    // @ts-ignore - this is not in the types
    let newRole = context.payload.changes!.permission.to

    // Bail out. No need to spend cycles on this one
    if (newRole === "admin" && ROLE_TO_SWITCH !== ROLE_TO_SWITCH) return;

    // since the event only has write (for both write and maintainer) we will need to read the current role
    // This only happens in added, edited does the right thing
    if (context.payload.action === "added") {
      const collaborator = await context.octokit.repos.getCollaboratorPermissionLevel({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        username: member.login
      })
      newRole = collaborator.data.role_name
    }

    context.log(`member ${member.login} ${context.payload.action} with role ${newRole}`)

    if (newRole === ROLE_TO_SWITCH) {
      context.log(`updating user ${member.login} with role ${ASSIGN_ROLE} on repo ${context.payload.repository.full_name}`);

      context.octokit.repos.addCollaborator({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        username: member.login,
        // @ts-ignore - this is not in the types      
        permission: "maintain-plus"
      });
    }
  })

  app.on("team", async (context) => {

    if (context.isBot) return;

    if (context.payload.action !== "added_to_repository" && context.payload.action !== "edited") return;

    context.log(`team ${context.payload.team.slug} ${context.payload.action}`)

    // with the application/vnd.github.v3.repository+json in the header it will return the data as well
    const permission = await context.octokit.teams.checkPermissionsForRepoInOrg({
      org: context.payload.repository!.owner.login,
      owner: context.payload.repository!.owner.login,
      repo: context.payload.repository!.name,
      team_slug: context.payload.team.slug,
      headers: {
        accept: "application/vnd.github.v3.repository+json"
      }
    })

    const newRole = permission.data.role_name

    context.log(`team ${context.payload.team.slug} ${context.payload.action} with role ${newRole}}`)

    if (newRole === ROLE_TO_SWITCH) {
      context.log(`updating team ${context.payload.team.slug} with role ${ASSIGN_ROLE} on repo ${context.payload.repository!.full_name}`);
      await context.octokit.teams.addOrUpdateRepoPermissionsInOrg({
        org: context.payload.organization.login,
        owner: context.payload.organization.login,
        repo: context.payload.repository!.name,
        // @ts-ignore - this is not in the types           
        permission: ASSIGN_ROLE,
        team_slug: context.payload.team.slug
      })
    }
  })

  app.on("repository.created", async (context) => {
    if (context.isBot) return;

    context.log(`repository ${context.payload.repository.full_name} created`)

    context.log(`updating team ${ADD_TEAM_SLUG} with role ${ASSIGN_ROLE} on repo ${context.payload.repository!.full_name}`);

    await context.octokit.teams.addOrUpdateRepoPermissionsInOrg({
      org: context.payload.organization!.login,
      owner: context.payload.organization!.login,
      repo: context.payload.repository!.name,
      // @ts-ignore - this is not in the types           
      permission: ASSIGN_ROLE,
      team_slug: ADD_TEAM_SLUG
    })
  })
}