//Load data on every page that is a child to +layout.server.ts
export function load({ locals }) {
  return {
    locals,
  };
}
