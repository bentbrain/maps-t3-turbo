import { env } from "@acme/env/env";

export default function PrivacyPolicy() {
  return (
    <main className="px-4 py-8 md:px-8">
      <div className="prose-sm mx-auto max-w-3xl">
        <h1>Privacy Policy</h1>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <p>
          This Privacy Policy explains how we collect, use, disclose, and
          safeguard your information when you use our website{" "}
          {env.NEXT_PUBLIC_SITE_URL} and our Google Chrome extension
          (collectively, the &quot;Service&quot;). By using the Service, you
          agree to the collection and use of information in accordance with this
          policy.
        </p>
        <p>
          <strong>Important:</strong> Maps & Locations is an independent
          third-party integration that is not affiliated with, endorsed by, or
          certified by Notion. We connect to your personal Notion workspace to
          provide our services.
        </p>
        <h2>1. Information We Collect</h2>
        <ul>
          <li>
            <strong>Account Information:</strong> When you connect your Notion
            workspace, we collect your name, email address, and Notion workspace
            details.
          </li>
          <li>
            <strong>Location Data:</strong> Through our Chrome extension, we
            collect location information from Google Maps that you choose to
            save, including place names, addresses, coordinates, and associated
            metadata.
          </li>
          <li>
            <strong>Notion Data:</strong> With your permission, we access and
            write data to your personal Notion workspace as required to save
            your locations and provide our Service.
          </li>
          <li>
            <strong>Usage Data:</strong> We may collect information about how
            you use the Service (both website and extension), such as access
            times, pages viewed, extension usage, and device information.
          </li>
          <li>
            <strong>Cookies & Tracking:</strong> We use cookies and similar
            tracking technologies to enhance your experience on our website.
          </li>
        </ul>
        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To provide, operate, and maintain the Service</li>
          <li>To improve, personalize, and expand our Service</li>
          <li>To communicate with you, including for support and updates</li>
          <li>
            To monitor usage and detect, prevent, and address technical issues
          </li>
          <li>To comply with legal obligations</li>
        </ul>
        <h2>3. How We Share Your Information</h2>
        <ul>
          <li>
            We do <strong>not</strong> sell your personal information.
          </li>
          <li>
            We may share information with service providers who assist us in
            operating the Service (e.g., hosting, analytics), subject to
            confidentiality agreements.
          </li>
          <li>
            We may disclose information if required by law or to protect our
            rights.
          </li>
        </ul>
        <h2>4. Data Security</h2>
        <p>
          We implement reasonable security measures to protect your information.
          However, no method of transmission over the Internet or electronic
          storage is 100% secure.
        </p>
        <h2>5. Your Rights</h2>
        <ul>
          <li>
            You may access, update, or delete your information by contacting us.
          </li>
          <li>
            You may revoke Notion access at any time via your Notion account
            settings.
          </li>
          <li>
            Depending on your location, you may have additional rights under
            laws such as GDPR or CCPA.
          </li>
        </ul>
        <h2>6. Third-Party Services</h2>
        <p>
          Our Service integrates with and relies on third-party services
          including:
        </p>
        <ul>
          <li>
            <strong>Notion:</strong> We connect to your personal Notion
            workspace to save location data. Your use of Notion is governed by
            Notion's own terms of service and privacy policy.
          </li>
          <li>
            <strong>Google Maps:</strong> Our Chrome extension operates on
            Google Maps to capture location data. Your use of Google Maps is
            governed by Google's terms of service and privacy policy.
          </li>
          <li>
            <strong>Other Services:</strong> Our Service may contain links to
            other third-party sites or services. We are not responsible for
            their privacy practices.
          </li>
        </ul>
        <h2>7. Children&apos;s Privacy</h2>
        <p>
          Our Service is not intended for children under 13. We do not knowingly
          collect information from children under 13.
        </p>
        <h2>8. Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify
          you of any changes by posting the new policy on this page.
        </p>
        <h2>9. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us
          at <a href="mailto:mapsupport@bent.build">mapsupport@bent.build</a>.
        </p>
      </div>
    </main>
  );
}
