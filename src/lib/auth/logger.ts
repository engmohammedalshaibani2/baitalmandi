export function logAuthAction(action: 'AUTH' | 'ADMIN_ACCESS' | 'ADMIN_REDIRECT' | 'UNAUTHORIZED_ACCESS', data: any) {
  const timestamp = new Date().toISOString();
  
  // Format the data as key=value pairs if possible
  const dataString = Object.entries(data)
    .map(([key, value]) => `${key}=${value}`)
    .join(' ');

  console.log(`[${action}] ${timestamp} ${dataString}`);
}
