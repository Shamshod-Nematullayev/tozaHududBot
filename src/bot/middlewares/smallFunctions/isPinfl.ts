export default function isPinFL(msg: string) {
  if (isNaN(Number(msg)) || msg.length != 14) {
    return false;
  }
  return true;
}
