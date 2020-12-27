// convert data from one form to another
// mostly pure functions

/**
 * Returns a obj with the key table_name and namespace
 * 
 * Pure function
 * @param table_name useful if we have a schema encoded table name
 */

export function destructure_table_name (table_name: string) : {table_name: string, namespace?: string}{
  const sp = table_name.split('.');
  if(sp.length > 2) throw new Error('To many namespaces');
  if(sp.length === 2) {
    return {table_name: sp[1], namespace: sp[0]};
  }
  return {table_name: sp[0]};
}