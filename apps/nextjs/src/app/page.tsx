import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Badge } from "@acme/ui/badge";
import { 
  MapPin, 
  Chrome, 
  Download, 
  Heart, 
  Zap, 
  Shield, 
  Globe,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { SignUp } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const user = await currentUser();
  if (user) {
    redirect(`/${user.id}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <MapPin className="w-8 h-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">Notion Locations</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="#features">Features</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="#download">Download</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            <Zap className="w-4 h-4 mr-1" />
            Free & Open Source
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Save Google Maps Locations 
            <span className="text-blue-600"> to Notion</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Seamlessly capture locations from Google Maps and organize them in Notion. 
            View all your saved places on a beautiful interactive map.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700" asChild>
              <Link href="#download">
                <Download className="w-5 h-5 mr-2" />
                Get Started Free
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="https://buymeacoffee.com/bentbrain" target="_blank" rel="noopener noreferrer">
                <Heart className="w-5 h-5 mr-2 text-red-500" />
                Buy me a coffee ☕
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to organize your locations
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A powerful combination of a Chrome extension and web app to make location management effortless.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Chrome className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Chrome Extension</CardTitle>
                <CardDescription>
                  Save any location from Google Maps with just one click
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-left space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    One-click saving from Google Maps
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Automatic Notion integration
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Capture location details
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Globe className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Web Dashboard</CardTitle>
                <CardDescription>
                  Visualize all your saved locations on an interactive map
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-left space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Interactive map view
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Search and filter locations
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Organize by categories
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>Privacy First</CardTitle>
                <CardDescription>
                  Your data stays in your Notion workspace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-left space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    No data collection
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Direct Notion integration
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Open source code
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Download & Installation Section */}
      <section id="download" className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Get Started in Minutes
              </h2>
              <p className="text-lg text-gray-600">
                Download the Chrome extension and start saving locations immediately
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Download className="w-6 h-6 mr-2 text-blue-600" />
                    Download Chrome Extension
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                    <Link href="https://github.com/bentbrain/maps-t3-turbo/releases/latest" target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      Download Latest Release
                    </Link>
                  </Button>
                  <p className="text-sm text-gray-600">
                    Currently version requires manual installation. Chrome Web Store listing coming soon!
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Installation Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                    <li>Download the extension zip file</li>
                    <li>Extract the zip to a folder</li>
                    <li>Open Chrome and go to chrome://extensions/</li>
                    <li>Enable "Developer mode" (top right)</li>
                    <li>Click "Load unpacked" and select the extracted folder</li>
                    <li>The extension is now ready to use!</li>
                  </ol>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 text-center">
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>Ready to Start?</CardTitle>
                  <CardDescription>
                    Create your account and connect your Notion workspace
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid place-items-center">
                    <SignUp />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Support the Project
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Notion Locations is completely free and open source. 
            If you find it useful, consider supporting its development.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline" asChild>
              <Link href="https://buymeacoffee.com/bentbrain" target="_blank" rel="noopener noreferrer">
                <Heart className="w-5 h-5 mr-2 text-red-500" />
                Buy me a coffee ☕
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="https://github.com/bentbrain/maps-t3-turbo" target="_blank" rel="noopener noreferrer">
                ⭐ Star on GitHub
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="w-6 h-6" />
                <span className="text-xl font-bold">Notion Locations</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Save Google Maps locations to Notion and visualize them on an interactive map. 
                Free, open source, and privacy-focused.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="#download" className="hover:text-white">Download</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms-of-use" className="hover:text-white">Terms of Use</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="https://github.com/bentbrain/maps-t3-turbo" target="_blank" className="hover:text-white">
                    GitHub Issues
                  </Link>
                </li>
                <li>
                  <Link href="https://buymeacoffee.com/bentbrain" target="_blank" className="hover:text-white">
                    Donate
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 Notion Locations. Open source software released under the MIT License.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
