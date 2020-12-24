import fs from "fs";
import path from 'path';


/**
 * Returns an array of filenames
 * @param path Path to dir, relative from the root directory
 * @param regex "full file path must satisfy the regular expression"
 */

export function getFileFromDir(dirPath: string, arrayOfFiles: string [], regex?: string) {
  let files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];
  arrayOfFiles as string[];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getFileFromDir(dirPath + "/" + file, arrayOfFiles, regex);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  })

  return arrayOfFiles;
}
