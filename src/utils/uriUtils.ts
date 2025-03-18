import * as vscode from "vscode";

/**
 * Utility functions for URI handling
 */

/**
 * Transforms a localhost URL to be accessible in the webview
 * @param url The original localhost URL
 * @returns Promise resolving to a transformed URL that can be used in a webview
 */
export async function getTransformedLocalhostUrl(url: string): Promise<string> {
  try {
    // Parse the input URL
    const uri = vscode.Uri.parse(url);
    
    // Check if it's a localhost URL
    const isLocalhost = uri.authority === "localhost" || 
                        uri.authority.startsWith("localhost:") || 
                        uri.authority === "127.0.0.1" || 
                        uri.authority.startsWith("127.0.0.1:");
    
    if (isLocalhost) {
      console.log("Transforming localhost URL:", url);
      
      // Extract port number if present
      let port = 80;
      if (uri.authority.includes(":")) {
        const portStr = uri.authority.split(":")[1];
        port = parseInt(portStr, 10);
      } else if (uri.scheme === "https") {
        port = 443;
      }
      
      console.log(`Detected localhost on port ${port}`);
      
      // Convert the URL into a format that can be used in a webview
      const transformedUri = await vscode.env.asExternalUri(uri);
      console.log("Transformed to:", transformedUri.toString());
      
      return transformedUri.toString();
    } else {
      console.log("Not a localhost URL, using as is:", url);
      return url;
    }
  } catch (error) {
    console.error("Failed to transform URL:", error);
    return url; // Fall back to original URL if transformation fails
  }
}

/**
 * Validates if a string is a valid URL
 * @param url The URL string to validate
 * @returns True if the URL is valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Ensures a URL has a protocol specified
 * @param url The URL to check
 * @returns URL with protocol
 */
export function ensureProtocol(url: string): string {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `http://${url}`;
  }
  return url;
}

/**
 * Parses a URL and extracts its components
 * @param url The URL to parse
 * @returns Object containing URL components
 */
export function parseUrl(url: string): {
  protocol: string;
  host: string;
  port: number;
  path: string;
  query: string;
} {
  try {
    const parsedUrl = new URL(url);
    
    // Get port, defaulting to 80 for http and 443 for https
    let port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : 
              (parsedUrl.protocol === "https:" ? 443 : 80);
    
    return {
      protocol: parsedUrl.protocol,
      host: parsedUrl.hostname,
      port: port,
      path: parsedUrl.pathname,
      query: parsedUrl.search
    };
  } catch (error) {
    console.error("Failed to parse URL:", error);
    return {
      protocol: "http:",
      host: "localhost",
      port: 80,
      path: "/",
      query: ""
    };
  }
} 