/** The shell mounts ChatThread for a phone Ask before the server page arrives. */
let owner: string | null = null;

export function claimShellChat(id: string) {
  owner = id;
}

export function releaseShellChat(id?: string) {
  if (!id || owner === id) owner = null;
}

export function shellOwnsChat(id: string) {
  return owner === id;
}
