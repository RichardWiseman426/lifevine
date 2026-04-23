import { LegalScreen } from '../../src/components/LegalScreen';

export default function DonationPolicy() {
  return (
    <LegalScreen
      title="Donation Policy"
      effectiveDate="April 2026"
      intro="LifeVine connects you with organizations and contributors in your community. This policy explains how donations work on our platform — both donations to LifeVine itself and donations to the contributors listed in the app."
      contactEmail="hello@lifevine.app"
      sections={[
        {
          heading: '1. We Do Not Process Contributor Donations',
          body: `When you tap the "Give" button on a contributor's profile, you are taken out of LifeVine and into that contributor's own donation page (such as Stripe, PayPal, or their church giving system).

LifeVine does not receive, process, hold, route, or have any access to funds you give to a contributor. The transaction takes place entirely between you and the contributor's payment processor.

LifeVine has no role in those transactions beyond providing the link.`,
        },
        {
          heading: '2. Card and Payment Information Is Never Stored by LifeVine',
          body: `LifeVine never collects, stores, or transmits credit card numbers, bank account information, or any other payment instrument data. All payment processing — for donations to LifeVine and for donations to contributors — is handled by third-party payment processors that meet industry standards for payment security (PCI DSS).

For LifeVine support gifts, we use Stripe. For contributor donations, the contributor's chosen processor handles the transaction.`,
        },
        {
          heading: '3. Donations to LifeVine Are Not Tax-Deductible',
          body: `LifeVine is not a registered 501(c)(3) tax-exempt charitable organization. Gifts made through the "Support LifeVine" button on the About screen are voluntary platform support contributions. They are not charitable contributions and cannot be claimed as tax-deductible donations.

If LifeVine ever becomes a recognized tax-exempt entity, this policy will be updated.`,
        },
        {
          heading: '4. Tax Status of Contributor Donations',
          body: `LifeVine does not verify, certify, or guarantee the tax-exempt status, charitable registration, or financial practices of any contributor listed in the app. The presence of a contributor on LifeVine — including a "Verified" badge — does not constitute an endorsement of their tax status or financial integrity.

If you are donating for tax purposes, you are responsible for verifying directly with the contributor that they are a registered charitable organization in your jurisdiction and for obtaining any tax receipt directly from them.`,
        },
        {
          heading: '5. Contributor Responsibilities',
          body: `Contributors who post a donation link on LifeVine are solely responsible for:

• Complying with all applicable laws regarding charitable solicitation in the states and countries where they accept donations
• Maintaining accurate registration with the IRS and state regulators where required
• Issuing tax receipts to donors when applicable
• Honoring the stated purpose for which donations were solicited
• Handling refunds and donor disputes directly

LifeVine does not mediate disputes between donors and contributors regarding the use of donated funds.`,
        },
        {
          heading: '6. Refunds',
          body: `Gifts made through "Support LifeVine" are non-refundable except where required by law.

Refund requests for donations made to a contributor must be directed to that contributor or their payment processor. LifeVine cannot issue or facilitate refunds for transactions it did not process.`,
        },
        {
          heading: '7. Reporting Misuse',
          body: `If you believe a contributor on LifeVine is misrepresenting their charitable status, soliciting fraudulently, or misusing donated funds, please report it to us at hello@lifevine.app. We take these reports seriously and may suspend or remove contributors found to be in violation of our terms.

We do not, however, act as a regulator or auditor and cannot guarantee the conduct of any contributor.`,
        },
        {
          heading: '8. Changes to This Policy',
          body: `We may update this policy from time to time. The effective date at the top of this page reflects the most recent update. Continued use of LifeVine after changes are posted constitutes acceptance of the updated policy.`,
        },
      ]}
    />
  );
}
