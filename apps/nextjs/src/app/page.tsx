import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { BuyMeACoffee, Chrome } from "@ridemountainpig/svgl-react";
import {
  CheckCircle,
  Download,
  Globe,
  Heart,
  MapPin,
  Shield,
  Zap,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

const features = [
  {
    title: "Chrome Extension",
    description: "Save any location from Google Maps with just one click",
    icon: <Chrome className="mb-3 h-8 w-8" />,
    features: [
      {
        icon: <CheckCircle className="mr-2 h-4 w-4" />,
        description: "One-click saving from Google Maps",
      },
      {
        icon: <CheckCircle className="mr-2 h-4 w-4" />,
        description: "Automatic Notion integration",
      },
      {
        icon: <CheckCircle className="mr-2 h-4 w-4" />,
        description: "Capture location details",
      },
    ],
  },
  {
    title: "Web Dashboard",
    description: "Visualize all your saved locations on an interactive map",
    icon: <Globe className="mb-3 h-8 w-8" />,
    features: [
      {
        icon: <CheckCircle className="mr-2 h-4 w-4" />,
        description: "Interactive map view",
      },
      {
        icon: <CheckCircle className="mr-2 h-4 w-4" />,
        description: "Capture location details",
      },
      {
        icon: <CheckCircle className="mr-2 h-4 w-4" />,
        description: "Organize by categories",
      },
    ],
  },
  {
    title: "Privacy First",
    description: "Your data stays in your Notion workspace",
    icon: <Shield className="mb-3 h-8 w-8" />,
    features: [
      {
        icon: <CheckCircle className="mr-2 h-4 w-4" />,
        description: "No data collection",
      },
      {
        icon: <CheckCircle className="mr-2 h-4 w-4" />,
        description: "Direct Notion integration",
      },
      {
        icon: <CheckCircle className="mr-2 h-4 w-4" />,
        description: "Open source code",
      },
    ],
  },
];

export default async function Home() {
  const user = await currentUser();
  if (user) {
    redirect(`/${user.id}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="container mx-auto flex items-center justify-between px-4 py-6">
        <div className="flex items-center space-x-2">
          <MapPin className="h-8 w-8" />
          <span className="text-2xl font-bold text-gray-900">
            Notion Locations
          </span>
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
        <div className="mx-auto max-w-4xl">
          <Badge variant="secondary" className="mb-4">
            <Zap className="mr-1 h-4 w-4" />
            Free & Open Source
          </Badge>
          <h1 className="mb-6 text-4xl leading-none font-extrabold text-balance text-gray-900 md:text-6xl">
            Save Google Maps locations
            <span className=""> to Notion.</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 md:text-xl">
            <SignInButton>
              <button className="cursor-pointer underline">Sign in</button>
            </SignInButton>{" "}
            with <span className="font-bold">Notion</span>. Download the{" "}
            <span className="font-bold">extension</span>. Save locations for{" "}
            <span className="font-bold">free</span>.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link
                href="/demo/tokyo"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin className="h-5 w-5" />
                Try the demo
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link
                href="https://buymeacoffee.com/bentbrain"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BuyMeACoffee className="h-5 w-5" />
                Buy me a coffee
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              Everything you need to organize your locations
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              A powerful combination of a Chrome extension and web app to make
              location management effortless.
            </p>
          </div>

          <div className="mb-16 grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <Feature key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Get Started Section */}
      <section id="get-started" className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
                Get started in minutes
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-600">
                Create your account and install the Chrome extension to start
                saving locations from Google Maps to your Notion workspace.
              </p>
            </div>

            <div className="grid gap-16 lg:grid-cols-2">
              {/* Extension Download */}
              <div className="text-center">
                <div className="mb-6">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <span className="text-lg font-bold">1</span>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">
                    Install Extension
                  </h3>
                  <p className="mb-6 text-gray-600">
                    Download and install the Chrome extension
                  </p>
                </div>
                <Button size="lg" asChild>
                  <Link
                    href="https://github.com/bentbrain/maps-t3-turbo/releases/latest"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download Extension
                  </Link>
                </Button>
              </div>

              {/* Account Setup */}
              <div className="text-center">
                <div className="mb-6">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <span className="text-lg font-bold">2</span>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">
                    Create Your Account
                  </h3>
                  <p className="text-gray-600">
                    Sign up to get access to your personal dashboard
                  </p>
                </div>
                <Button className="cursor-pointer" size="lg" asChild>
                  <SignInButton />
                </Button>
              </div>
            </div>

            {/* Installation Steps */}
            <div className="mt-16">
              <div className="mb-8 text-center">
                <h3 className="mb-2 text-2xl font-bold text-gray-900">
                  How to install the extension
                </h3>
                <p className="text-gray-600">
                  Follow these simple steps to start saving locations
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center">
                    <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-bold">
                      1
                    </div>
                    <h4 className="font-semibold text-gray-900">Download</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Download the extension zip file from the latest release
                  </p>
                </div>

                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center">
                    <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-bold">
                      2
                    </div>
                    <h4 className="font-semibold text-gray-900">Extract</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Extract the zip file to a folder on your computer
                  </p>
                </div>

                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center">
                    <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-bold">
                      3
                    </div>
                    <h4 className="font-semibold text-gray-900">Open Chrome</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Navigate to{" "}
                    <code className="rounded bg-gray-100 px-1 text-xs">
                      chrome://extensions/
                    </code>
                  </p>
                </div>

                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center">
                    <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-bold">
                      4
                    </div>
                    <h4 className="font-semibold text-gray-900">
                      Developer Mode
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Enable "Developer mode" toggle in the top right corner
                  </p>
                </div>

                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center">
                    <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-bold">
                      5
                    </div>
                    <h4 className="font-semibold text-gray-900">
                      Load Extension
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Click "Load unpacked" and select the extracted folder
                  </p>
                </div>

                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center">
                    <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-bold">
                      6
                    </div>
                    <h4 className="font-semibold text-gray-900">Ready!</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    The extension is now installed and ready to use
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            Support the project
          </h2>
          <p className="mb-8 text-lg text-gray-600">
            Notion Locations is completely free and open source. If you find it
            useful, consider supporting its development.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="outline" asChild>
              <Link
                href="https://buymeacoffee.com/bentbrain"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Heart className="mr-2 h-5 w-5 text-red-500" />
                Buy me a coffee ☕
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link
                href="https://github.com/bentbrain/maps-t3-turbo"
                target="_blank"
                rel="noopener noreferrer"
              >
                ⭐ Star on GitHub
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 text-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="mb-4 flex items-center space-x-2">
                <MapPin className="h-6 w-6" />
                <span className="text-xl font-bold">Notion Locations</span>
              </div>
              <p className="max-w-md text-gray-400">
                Save Google Maps locations to Notion and visualize them on an
                interactive map. Free, open source, and privacy-focused.
              </p>
            </div>
            <div>
              <h3 className="mb-4 font-semibold">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#features" className="hover:text-white">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#download" className="hover:text-white">
                    Download
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-use" className="hover:text-white">
                    Terms of Use
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="https://github.com/bentbrain/maps-t3-turbo"
                    target="_blank"
                    className="hover:text-white"
                  >
                    GitHub Issues
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://buymeacoffee.com/bentbrain"
                    target="_blank"
                    className="hover:text-white"
                  >
                    Donate
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mx-auto mt-8 max-w-6xl border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>
              &copy; 2024 Notion Locations. Open source software released under
              the MIT License.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const Feature = ({
  title,
  description,
  features,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: {
    icon: React.ReactNode;
    description: string;
  }[];
}) => {
  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader>
        {icon}
        <CardTitle>{title}</CardTitle>
        <CardDescription className="text-balance">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-gray-600">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              {feature.icon}
              {feature.description}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
