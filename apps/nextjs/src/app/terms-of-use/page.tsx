import { env } from "@acme/env/env";

export default function TermsOfUse() {
  return (
    <main className="px-4 py-8 md:px-8">
      <div className="prose-sm mx-auto max-w-3xl">
        <h1>Terms of Use</h1>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <p>
          These Terms of Use (&quot;Terms&quot;) govern your access to and use
          of our website {env.NEXT_PUBLIC_SITE_URL} and our Google Chrome
          extension (collectively, the &quot;Service&quot;). By accessing or
          using the Service, you agree to be bound by these Terms. If you do not
          agree, please do not use the Service.
        </p>
        <p>
          <strong>Important:</strong> Maps & Locations is an independent
          third-party integration that is not affiliated with, endorsed by, or
          certified by Notion. We provide tools that connect to your personal
          Notion workspace.
        </p>
        <h2>1. Use of the Service</h2>
        <ul>
          <li>You must be at least 13 years old to use the Service.</li>
          <li>
            You agree to use the Service only for lawful purposes and in
            accordance with these Terms.
          </li>
          <li>
            You are responsible for maintaining the confidentiality of your
            account credentials.
          </li>
        </ul>
        <h2>2. Description of Service</h2>
        <p>
          Our Service consists of a website and Chrome extension that allows you
          to save locations from Google Maps directly to your personal Notion
          workspace. The Service enables you to capture location data including
          place names, addresses, and related information, and organize them in
          your Notion databases. The Service is provided &quot;as is&quot; and
          may be updated, changed, or discontinued at any time.
        </p>
        <h2>3. User Responsibilities</h2>
        <ul>
          <li>
            You are responsible for your use of the Service and any content you
            provide.
          </li>
          <li>
            You must not use the Service to violate any laws or third-party
            rights, including Notion&apos;s terms and policies and Google&apos;s
            terms and policies.
          </li>
          <li>
            You must not attempt to gain unauthorized access to any part of the
            Service, its systems, or connected third-party services.
          </li>
          <li>
            You are responsible for ensuring you have the right to save and
            store the location data you capture using our Service.
          </li>
        </ul>
        <h2>4. Restrictions</h2>
        <ul>
          <li>
            No reverse engineering, copying, modification, or reselling the
            Service or Chrome extension.
          </li>
          <li>
            No use of the Service for illegal, harmful, or abusive activities.
          </li>
          <li>
            No interference with the operation or security of the Service or
            connected third-party services.
          </li>
          <li>
            No automated or excessive use that could overload our systems or
            connected services.
          </li>
        </ul>
        <h2>5. Intellectual Property</h2>
        <p>
          All content, trademarks, and intellectual property related to the
          Service are owned by us or our licensors. You may not use our branding
          or materials without permission.
        </p>
        <h2>6. Disclaimers</h2>
        <p>
          The Service is provided on an &quot;as is&quot; and &quot;as
          available&quot; basis. We disclaim all warranties, express or implied,
          including merchantability, fitness for a particular purpose, and
          non-infringement. We do not guarantee the Service will be error-free
          or uninterrupted.
        </p>
        <h2>7. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, we are not liable for any
          indirect, incidental, special, consequential, or punitive damages, or
          any loss of profits or revenues, arising from your use of the Service.
        </p>
        <h2>8. Termination</h2>
        <p>
          We may suspend or terminate your access to the Service at any time,
          with or without notice, for any reason, including violation of these
          Terms.
        </p>
        <h2>9. Changes to Terms</h2>
        <p>
          We may update these Terms from time to time. We will notify you of
          changes by posting the new Terms on this page. Continued use of the
          Service after changes means you accept the new Terms.
        </p>
        <h2>10. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us at{" "}
          <a href="mailto:mapsupport@bent.build">mapsupport@bent.build</a>.
        </p>
      </div>
    </main>
  );
}
