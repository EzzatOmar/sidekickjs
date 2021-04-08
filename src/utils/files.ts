import fs from "fs";
import path from 'path';

export function listDir(dirPath: string, arrayOfFiles: string[]): string[] {
  fs.readdirSync(dirPath).forEach((file: string) => {
    const absolute = path.join(dirPath, file);
    if (fs.statSync(absolute).isDirectory()) return listDir(absolute, arrayOfFiles);
    else return arrayOfFiles.push(absolute);
  });
  return arrayOfFiles;
}

/**
 * Returns an array of filenames
 * @param path Path to dir, relative from the root directory
 * @param regex "full file path must satisfy the regular expression"
 */

export function getFileFromDir(dirPath: string, arrayOfFiles: string[], regex?: string) {
  let allFiles = listDir(dirPath, []);
  allFiles.forEach((file: string) => {
    let indexOf = !!file.indexOf(dirPath);
    let newPart = file.substr(dirPath.length - (indexOf ? 1 : -1));
    if ((!regex) || new RegExp(regex).test(newPart)) {
      arrayOfFiles.push(file);
    }
  });

  return arrayOfFiles;
}
