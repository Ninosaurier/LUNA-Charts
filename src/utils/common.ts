// eslint-disable-next-line import/prefer-default-export
export function generateId() {
  return Date.now().toString(36) + Math.floor(10 ** 12 + Math.random() * 9 * 10 ** 12).toString(36);
}
