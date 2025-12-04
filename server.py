import http.server
import socketserver
import os
import sys

PORT = 8000

# Change to the directory where the script is located
os.chdir(os.path.dirname(os.path.abspath(__file__)))

Handler = http.server.SimpleHTTPRequestHandler

try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        print("Press Ctrl+C to stop the server")
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\nServer stopped.")
    sys.exit(0)
except OSError as e:
    print(f"Error: {e}")
    print(f"Port {PORT} might be in use. Try closing other servers or changing the port.")
    input("Press Enter to exit...")
