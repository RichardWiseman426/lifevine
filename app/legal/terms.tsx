import { LegalScreen } from '../../src/components/LegalScreen';

export default function TermsOfService() {
  return (
    <LegalScreen
      title="Terms of Service"
      effectiveDate="April 2026"
      intro="By using LifeVine, you agree to these terms. They are written to be readable, not hostile. If something is unclear, please reach out."
      contactEmail="hello@lifevine.app"
      sections={[
        {
          heading: '1. Who Can Use LifeVine',
          body: `You must be at least 13 years old to use LifeVine. If you are under 18, you confirm that a parent or guardian is aware of your use of the app.

You agree to provide accurate information when creating your account and to keep that information up to date.`,
        },
        {
          heading: '2. Your Account',
          body: `You are responsible for maintaining the security of your password and for all activity that occurs under your account. If you suspect unauthorized access, contact us immediately.

You may not share your account, sell it, or transfer it to anyone else.`,
        },
        {
          heading: '3. How You Agree to Behave',
          body: `LifeVine is a community space. Use it accordingly. You agree NOT to:

• Post content that is harassing, hateful, threatening, or discriminatory
• Impersonate another person, organization, or LifeVine itself
• Post content that promotes violence, self-harm, or illegal activity
• Solicit money or personal information through deceptive means
• Spam, scrape, or use automated tools to interact with the platform
• Attempt to access another user's account or LifeVine's systems
• Misrepresent the charitable, religious, or organizational status of any entity

Violations may result in content removal, suspension, or permanent removal of your account.`,
        },
        {
          heading: '4. Content You Post',
          body: `You retain ownership of any content you post on LifeVine — your testimonies, photos, organization profiles, and messages. By posting it, you grant LifeVine a non-exclusive, worldwide license to display, distribute, and store that content for the purpose of operating the app.

You are responsible for ensuring you have the right to post anything you upload. Do not upload copyrighted material you do not own or have permission to share.`,
        },
        {
          heading: '5. Contributor Organizations',
          body: `Organizations and contributors listed on LifeVine ("Contributors") are independent third parties. LifeVine does not employ, endorse, certify, or supervise Contributors. The "Verified" badge indicates basic identity verification only — it is not a quality, safety, or financial endorsement.

You are responsible for your own decisions about which Contributors to engage with, donate to, attend events for, or volunteer with. Use the same judgment you would when interacting with any organization in your community.`,
        },
        {
          heading: '6. Donations',
          body: `Please see our separate Donation Policy for full details. In summary:

• Donations to LifeVine are voluntary platform support contributions and are not tax-deductible
• Donations to Contributors go directly to them through their own payment processor — LifeVine does not receive or hold those funds
• LifeVine never stores card or bank information
• You are responsible for verifying the tax-exempt status of any Contributor before claiming a tax deduction`,
        },
        {
          heading: '7. Moderation',
          body: `LifeVine reserves the right to review, remove, or restrict any content or account that violates these terms or that we believe in good faith poses harm to the community.

Testimonies and resources go through a moderation review before publication. We aim to act fairly and transparently but make moderation decisions at our discretion.`,
        },
        {
          heading: '8. No Warranty',
          body: `LifeVine is provided "as is" and "as available." We make no guarantees that the app will be uninterrupted, error-free, or that any information on it is complete or accurate.

LifeVine is not a substitute for professional medical, legal, financial, or mental health advice. Crisis resources listed in the app are provided as references — if you are in immediate danger, call your local emergency services.`,
        },
        {
          heading: '9. Limitation of Liability',
          body: `To the fullest extent permitted by law, LifeVine and its operators are not liable for indirect, incidental, special, or consequential damages arising from your use of the app — including damages arising from interactions with other users, Contributors, or third parties whose links or content appear on the app.

Our total liability for any claim related to LifeVine will not exceed one hundred U.S. dollars ($100).`,
        },
        {
          heading: '10. Termination',
          body: `You may stop using LifeVine and delete your account at any time. We may suspend or terminate your access to the app at our discretion if we believe you have violated these terms.

Provisions of these terms that by their nature should survive termination — including content licenses, disclaimers, and limitations of liability — will continue to apply.`,
        },
        {
          heading: '11. Governing Law',
          body: `These terms are governed by the laws of the state in which LifeVine is operated, without regard to conflict of laws principles. Any disputes will be resolved in the state and federal courts located there.`,
        },
        {
          heading: '12. Changes to These Terms',
          body: `We may update these terms as the app evolves. The effective date at the top of this page reflects the most recent update. We will notify you of material changes through the app or by email before they take effect.

Your continued use of LifeVine after changes are posted constitutes acceptance of the updated terms.`,
        },
      ]}
    />
  );
}
