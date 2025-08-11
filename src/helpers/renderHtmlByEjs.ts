import ejs from "ejs";
import path from "path";

/**
 * Render HTML by EJS
 * @param filename Filename relative to src/views
 * @param data Data for EJS template
 * @returns Rendered HTML string
 */
export async function renderHtmlByEjs<T extends object>(
  filename: string,
  data: T
): Promise<string> {
  const filePath = path.join(process.cwd(), "src", "views", filename);
  return ejs.renderFile(filePath, data);
}
