import { LegalScreen } from '../../src/components/LegalScreen';

export default function PrivacyPolicy() {
  return (
    <LegalScreen
      title="Privacy Policy"
      effectiveDate="April 2026"
      intro="LifeVine is built around community connection. We collect only what we need to make the app work, we do not sell your data, and we are transparent about who we share information with."
      contactEmail="privacy@lifevine.app"
      sections={[
        {
          heading: '1. What We Collect',
          body: `When you create an account, we collect:
• Your email address (used to log in and contact you)
• Your username and display name
• Your profile photo (if you upload one)
• Your city and state (if you choose to add them)
• Content you create — testimonies, messages, organization profiles, RSVPs, opportunity responses

When you use the app, we may also automatically collect:
• Basic technical info (device type, app version, language)
• Crash and performance logs to help us fix bugs
• Last active timestamp`,
        },
        {
          heading: '2. What We Do Not Collect',
          body: `We do not collect:
• Precise GPS location (only city/state if you provide it)
• Credit card or bank account information (handled by payment processors, never seen by LifeVine)
• Contacts from your phone
• Photos from your library beyond what you specifically choose to upload
• Microphone or camera access without your explicit action`,
        },
        {
          heading: '3. How We Use Your Information',
          body: `We use the information we collect to:
• Provide and maintain the LifeVine service
• Show you content relevant to your area (events near you, local stories)
• Allow you to message contributors and respond to opportunities
• Communicate important account or service updates
• Detect and prevent fraud, abuse, and violations of our terms
• Improve the app based on aggregated usage patterns`,
        },
        {
          heading: '4. We Do Not Sell Your Data',
          body: `LifeVine does not sell, rent, or trade your personal information to advertisers, data brokers, or any third party. We do not run advertisements in the app and have no plans to do so.`,
        },
        {
          heading: '5. Service Providers We Share Data With',
          body: `To run the app, we share certain data with trusted service providers who are contractually bound to protect it:

• Supabase — our database, authentication, and file storage provider
• Stripe — for processing donations to LifeVine (only when you make a donation)
• Expo — for delivering app updates and crash reports
• Email delivery providers — for transactional emails like password resets

These providers process data on our behalf under their own privacy and security commitments.`,
        },
        {
          heading: '6. What Other Users Can See',
          body: `Your username, display name, profile photo, bio, and city/state (if set) are visible to other LifeVine users.

Testimonies you publish are public unless you mark them anonymous.

Messages are private to the people in the conversation.

Email addresses, phone numbers, and account creation timestamps are not shown to other users.`,
        },
        {
          heading: '7. Your Rights',
          body: `You can:
• View and edit your profile information at any time from the Profile tab
• Request a copy of your data by emailing privacy@lifevine.app
• Delete your account at any time — this will remove your profile, testimonies, and personal content from public view
• Opt out of non-essential email notifications in Settings

If you are in the EU, UK, California, or another jurisdiction with specific data protection laws, you have additional rights under those laws including the right to portability and the right to object to processing.`,
        },
        {
          heading: '8. Data Retention',
          body: `We keep your account data as long as your account is active. After account deletion, we remove personal content from public view immediately and delete it from our active systems within 30 days. Some information may be retained longer in backups or where required by law.

Messages you have sent will remain visible to other participants in the conversation even after you delete your account, but will be detached from your identifying information.`,
        },
        {
          heading: '9. Children',
          body: `LifeVine is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has created an account, please contact us at privacy@lifevine.app and we will remove the account.`,
        },
        {
          heading: '10. Security',
          body: `We use industry-standard security practices to protect your data, including encrypted connections (HTTPS), encrypted storage, secure authentication, and database-level access controls. No system is perfectly secure, however, and we cannot guarantee absolute protection.

If we ever experience a data breach affecting your personal information, we will notify you and any required regulators promptly.`,
        },
        {
          heading: '11. Changes to This Policy',
          body: `We may update this policy as the app evolves. The effective date at the top of this page reflects the most recent update. We will notify you of material changes through the app or by email before they take effect.`,
        },
      ]}
    />
  );
}
