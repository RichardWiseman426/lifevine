import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, TextInput, ActivityIndicator, Modal, Image,
  Dimensions, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/auth';
import { BackHeader } from '../../src/components/BackHeader';
import { pickAndUploadImage } from '../../src/lib/storage';

const { width: SW } = Dimensions.get('window');
const GALLERY_CELL = (SW - 48 - 16) / 3;
const BANNER_HEIGHT = SW * 0.45;

// ── Constants ──────────────────────────────────────────────────────
const ORG_TYPES = [
  { label: 'Church',               value: 'church'        },
  { label: 'Ministry',             value: 'ministry'      },
  { label: 'Support Group',        value: 'support_group' },
  { label: 'Therapy / Counseling', value: 'therapy'       },
  { label: 'Medical / Health',     value: 'medical'       },
  { label: 'Nonprofit',            value: 'nonprofit'     },
  { label: 'Community Org',        value: 'community'     },
];

const DENOMINATIONS = [
  'Non-Denominational','Baptist – Southern Baptist Convention',
  'Baptist – Independent','Baptist – American Baptist',
  'Baptist – Primitive Baptist','Methodist – United Methodist',
  'Methodist – Free Methodist','Methodist – Wesleyan',
  'Lutheran – ELCA','Lutheran – LCMS','Presbyterian – PCA',
  'Presbyterian – PCUSA','Reformed / Calvinist','Anglican / Episcopal',
  'Pentecostal – Assemblies of God','Pentecostal – Church of God',
  'Pentecostal – COGIC','Charismatic / Spirit-Filled','Catholic',
  'Orthodox – Greek Orthodox','Orthodox – Russian Orthodox',
  'Seventh-day Adventist','Church of Christ',
  'Churches of Christ (Restoration Movement)','Church of God (Anderson)',
  'Nazarene','Mennonite / Amish','Quaker / Friends','Evangelical Free',
  'Christian & Missionary Alliance','Vineyard','Four Square','Other',
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV',
  'NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN',
  'TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

const SERVICES_LIST = [
  'Individual Therapy','Couples Therapy','Family Counseling','Group Therapy',
  'Christian Counseling','Marriage Counseling','Addiction Recovery',
  'Grief Counseling','Trauma Therapy','Anxiety & Depression Treatment',
  'Teen & Youth Counseling','Pastoral Counseling','Life Coaching',
  'Crisis Intervention','Primary Care','Mental Health Evaluation',
  'Pediatrics',"Women's Health",'Nutrition Counseling','Preventive Care',
  'Chronic Disease Management','Telehealth','Behavioral Health',
  'Substance Abuse Treatment','Food Pantry','Clothing Assistance',
  'Emergency Shelter','Job Training & Placement','Financial Counseling',
  'After-School Programs','Senior Services','Transportation Assistance',
  'Prayer Ministry','Worship Services','Bible Study','Youth Programs',
  'Community Outreach','Missions','Discipleship','Small Groups',
];

// ── Picker Modal ───────────────────────────────────────────────────
function PickerModal({ visible, title, items, selected, onSelect, onClose }: {
  visible: boolean; title: string; items: string[];
  selected: string; onSelect: (v: string) => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={picker.safe}>
        <View style={picker.header}>
          <Text style={picker.title}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={picker.done}>Done</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={items} keyExtractor={i => i}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[picker.row, selected === item && picker.rowActive]}
              onPress={() => { onSelect(item); onClose(); }}
            >
              <Text style={[picker.rowText, selected === item && picker.rowTextActive]}>{item}</Text>
              {selected === item && <Text style={picker.check}>✓</Text>}
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

// ── Main screen ────────────────────────────────────────────────────
export default function OrgEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();

  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Visual
  const [bannerUrl, setBannerUrl]     = useState<string | null>(null);
  const [logoUrl, setLogoUrl]         = useState<string | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<(string | null)[]>(Array(6).fill(null));
  const [bannerUploading, setBannerUploading] = useState(false);
  const [logoUploading, setLogoUploading]     = useState(false);
  const [galleryUploading, setGalleryUploading] = useState<number | null>(null);
  const [pastorImageUploading, setPastorImageUploading] = useState(false);

  // Basic info
  const [orgName, setOrgName]               = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription]       = useState('');
  const [missionStatement, setMissionStatement] = useState('');

  // Type
  const [category, setCategory]             = useState('church');
  const [denomination, setDenomination]     = useState('');

  // Location
  const [addressLine1, setAddressLine1]     = useState('');
  const [city, setCity]                     = useState('');
  const [orgState, setOrgState]             = useState('');
  const [postalCode, setPostalCode]         = useState('');

  // Contact
  const [contactName, setContactName]       = useState('');
  const [contactTitle, setContactTitle]     = useState('');
  const [contactEmail, setContactEmail]     = useState('');
  const [contactPhone, setContactPhone]     = useState('');
  const [websiteUrl, setWebsiteUrl]         = useState('');
  const [donationUrl, setDonationUrl]       = useState('');

  // Social
  const [facebook, setFacebook]             = useState('');
  const [instagram, setInstagram]           = useState('');
  const [youtube, setYoutube]               = useState('');
  const [twitter, setTwitter]               = useState('');

  // Services
  const [serviceTimes, setServiceTimes]     = useState('');
  const [servicesOffered, setServicesOffered] = useState<string[]>([]);
  const [practiceDetails, setPracticeDetails] = useState('');

  // Pastor
  const [pastorName, setPastorName]         = useState('');
  const [pastorTitle, setPastorTitle]       = useState('');
  const [pastorBio, setPastorBio]           = useState('');
  const [pastorImageUrl, setPastorImageUrl] = useState<string | null>(null);

  // Tags
  const [tagsInput, setTagsInput]           = useState('');

  // Pickers
  const [showTypePicker, setShowTypePicker]   = useState(false);
  const [showDenomPicker, setShowDenomPicker] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);

  // ── Load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !id) return;
    async function load() {
      setLoading(true);
      const { data: membership } = await supabase
        .from('org_members').select('role')
        .eq('org_id', id).eq('user_id', user!.id).eq('status', 'active').single();
      if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
        setAccessDenied(true); setLoading(false); return;
      }
      const { data: org } = await supabase.from('organizations').select('*').eq('id', id).single();
      if (org) {
        setBannerUrl(org.banner_url ?? null);
        setLogoUrl(org.logo_url ?? null);
        setOrgName(org.name ?? '');
        setShortDescription(org.short_description ?? '');
        setDescription(org.description ?? '');
        setMissionStatement((org as any).mission_statement ?? '');
        setCategory(org.category ?? 'church');
        setDenomination((org as any).denomination ?? '');
        setAddressLine1((org as any).address_line1 ?? '');
        setCity(org.city ?? '');
        setOrgState(org.state ?? '');
        setPostalCode((org as any).postal_code ?? '');
        setContactName((org as any).contact_name ?? '');
        setContactTitle((org as any).contact_title ?? '');
        setContactEmail(org.email ?? '');
        setContactPhone((org as any).phone ?? '');
        setWebsiteUrl(org.website_url ?? '');
        setDonationUrl((org as any).donation_url ?? '');
        setFacebook((org as any).social_facebook ?? '');
        setInstagram((org as any).social_instagram ?? '');
        setYoutube((org as any).social_youtube ?? '');
        setTwitter((org as any).social_twitter ?? '');
        setServiceTimes((org as any).service_times ?? '');
        setServicesOffered((org as any).services_offered ?? []);
        setPracticeDetails((org as any).practice_details ?? '');
        setPastorName((org as any).pastor_name ?? '');
        setPastorTitle((org as any).pastor_title ?? '');
        setPastorBio((org as any).pastor_bio ?? '');
        setPastorImageUrl((org as any).pastor_image_url ?? null);
        const gallery: (string | null)[] = Array(6).fill(null);
        ((org as any).gallery_urls ?? []).slice(0, 6).forEach((u: string, i: number) => { gallery[i] = u; });
        setGalleryUrls(gallery);
        setTagsInput((org.tags ?? []).join(', '));
      }
      setLoading(false);
    }
    load();
  }, [user, id]);

  // ── Uploads ───────────────────────────────────────────────────────
  async function handleBannerUpload() {
    setBannerUploading(true);
    const { url, error } = await pickAndUploadImage('org-assets', `${id}/banner.jpg`, { aspect: [16, 9] });
    if (error) Alert.alert('Upload Error', error); else if (url) setBannerUrl(url);
    setBannerUploading(false);
  }
  async function handleLogoUpload() {
    setLogoUploading(true);
    const { url, error } = await pickAndUploadImage('org-assets', `${id}/logo.jpg`);
    if (error) Alert.alert('Upload Error', error); else if (url) setLogoUrl(url);
    setLogoUploading(false);
  }
  async function handleGalleryUpload(index: number) {
    setGalleryUploading(index);
    const { url, error } = await pickAndUploadImage('org-assets', `${id}/gallery_${index}.jpg`, { aspect: [4, 3] });
    if (error) { Alert.alert('Upload Error', error); }
    else if (url) setGalleryUrls(prev => { const n = [...prev]; n[index] = url; return n; });
    setGalleryUploading(null);
  }
  async function handlePastorImageUpload() {
    setPastorImageUploading(true);
    const { url, error } = await pickAndUploadImage('org-assets', `${id}/pastor.jpg`);
    if (error) Alert.alert('Upload Error', error); else if (url) setPastorImageUrl(url);
    setPastorImageUploading(false);
  }

  function toggleService(s: string) {
    setServicesOffered(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  }

  function removeGallery(index: number) {
    Alert.alert('Remove Photo', 'Remove this photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () =>
          setGalleryUrls(prev => { const n = [...prev]; n[index] = null; return n; })
      },
    ]);
  }

  // ── Save ─────────────────────────────────────────────────────────
  async function handleSave() {
    if (!orgName.trim()) { Alert.alert('Required', 'Organization name is required.'); return; }
    setSaving(true);
    const { error } = await supabase.from('organizations').update({
      banner_url:        bannerUrl,
      logo_url:          logoUrl,
      name:              orgName.trim(),
      short_description: shortDescription.trim() || null,
      description:       description.trim() || null,
      mission_statement: missionStatement.trim() || null,
      category,
      denomination:      denomination || null,
      address_line1:     addressLine1.trim() || null,
      city:              city.trim() || null,
      state:             orgState.trim() || null,
      postal_code:       postalCode.trim() || null,
      contact_name:      contactName.trim() || null,
      contact_title:     contactTitle.trim() || null,
      email:             contactEmail.trim() || null,
      phone:             contactPhone.trim() || null,
      website_url:       websiteUrl.trim() || null,
      donation_url:      donationUrl.trim() || null,
      social_facebook:   facebook.trim() || null,
      social_instagram:  instagram.trim() || null,
      social_youtube:    youtube.trim() || null,
      social_twitter:    twitter.trim() || null,
      service_times:     serviceTimes.trim() || null,
      services_offered:  servicesOffered,
      practice_details:  practiceDetails.trim() || null,
      pastor_name:       pastorName.trim() || null,
      pastor_title:      pastorTitle.trim() || null,
      pastor_bio:        pastorBio.trim() || null,
      pastor_image_url:  pastorImageUrl,
      gallery_urls:      galleryUrls.filter(Boolean) as string[],
      tags:              tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      updated_at:        new Date().toISOString(),
    }).eq('id', id);
    setSaving(false);
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Saved!', 'Your organization profile has been updated.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  // ── Guard states ──────────────────────────────────────────────────
  if (loading) return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <BackHeader title="Edit Organization" />
      <View style={s.centered}><ActivityIndicator color="#2D6A4F" size="large" /></View>
    </SafeAreaView>
  );
  if (accessDenied) return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <BackHeader title="Edit Organization" />
      <View style={s.centered}><Text style={s.denied}>You don't have permission to edit this organization.</Text></View>
    </SafeAreaView>
  );

  const catLabel = ORG_TYPES.find(t => t.value === category)?.label ?? category;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <BackHeader
        title="Edit Organization"
        rightElement={
          <TouchableOpacity onPress={handleSave} disabled={saving} style={s.saveBtn}>
            {saving ? <ActivityIndicator color="#2D6A4F" size="small" />
                    : <Text style={s.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── Banner + Logo ─────────────────────────────────────── */}
        <View style={s.visualSection}>
          {/* Banner */}
          <TouchableOpacity style={[s.bannerSlot, { height: BANNER_HEIGHT }]} onPress={handleBannerUpload} activeOpacity={0.85} disabled={bannerUploading}>
            {bannerUrl ? (
              <Image source={{ uri: bannerUrl }} style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, s.bannerFallback]}>
                <Text style={s.bannerFallbackIcon}>🖼️</Text>
                <Text style={s.bannerFallbackText}>Tap to add a cover photo</Text>
              </View>
            )}
            <View style={s.bannerOverlay}>
              {bannerUploading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.bannerOverlayText}>📷  {bannerUrl ? 'Change Cover' : 'Add Cover'}</Text>}
            </View>
          </TouchableOpacity>

          {/* Logo overlapping banner */}
          <TouchableOpacity style={s.logoWrap} onPress={handleLogoUpload} disabled={logoUploading} activeOpacity={0.85}>
            {logoUrl
              ? <Image source={{ uri: logoUrl }} style={s.logoImg} />
              : <View style={s.logoFallback}><Text style={s.logoFallbackIcon}>🏛️</Text></View>}
            <View style={s.logoCamBadge}>
              {logoUploading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.logoCamIcon}>📷</Text>}
            </View>
          </TouchableOpacity>
          <Text style={s.logoHint}>Tap logo to change</Text>
        </View>

        {/* ── Organization Info ────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Organization Info</Text>

          <Text style={s.label}>Organization Name *</Text>
          <TextInput style={s.input} value={orgName} onChangeText={setOrgName} placeholder="Name" maxLength={200} autoCapitalize="words" />

          <Text style={s.label}>Mission Statement</Text>
          <Text style={s.hint}>A single sentence capturing why you exist.</Text>
          <TextInput style={s.input} value={missionStatement} onChangeText={setMissionStatement} placeholder="We exist to…" maxLength={300} />

          <Text style={s.label}>Short Description</Text>
          <Text style={s.hint}>1–2 sentences shown on cards and search results.</Text>
          <TextInput style={[s.input, s.inputMid]} value={shortDescription} onChangeText={setShortDescription} placeholder="A brief summary…" maxLength={280} multiline textAlignVertical="top" />

          <Text style={s.label}>Full Description</Text>
          <TextInput style={[s.input, s.inputTall]} value={description} onChangeText={setDescription} placeholder="Tell people who you are and what you do…" maxLength={5000} multiline textAlignVertical="top" />
        </View>

        {/* ── Type ─────────────────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Organization Type</Text>

          <Text style={s.label}>Type</Text>
          <TouchableOpacity style={s.pickerRow} onPress={() => setShowTypePicker(true)}>
            <Text style={s.pickerVal}>{catLabel}</Text>
            <Text style={s.pickerArrow}>▾</Text>
          </TouchableOpacity>

          <Text style={[s.label, { marginTop: 16 }]}>Denomination</Text>
          <Text style={s.hint}>For churches — leave blank if not applicable.</Text>
          <TouchableOpacity style={s.pickerRow} onPress={() => setShowDenomPicker(true)}>
            <Text style={denomination ? s.pickerVal : s.pickerPlaceholder}>{denomination || 'Select denomination…'}</Text>
            <Text style={s.pickerArrow}>▾</Text>
          </TouchableOpacity>
        </View>

        {/* ── Location ─────────────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Location</Text>
          <Text style={s.hint}>Your full address will be shown publicly on your profile.</Text>

          <Text style={s.label}>Street Address</Text>
          <TextInput style={s.input} value={addressLine1} onChangeText={setAddressLine1} placeholder="123 Main St" autoCapitalize="words" />

          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>City</Text>
              <TextInput style={s.input} value={city} onChangeText={setCity} placeholder="Dallas" autoCapitalize="words" />
            </View>
            <View style={{ width: 90 }}>
              <Text style={s.label}>State</Text>
              <TouchableOpacity style={s.pickerRow} onPress={() => setShowStatePicker(true)}>
                <Text style={orgState ? s.pickerVal : s.pickerPlaceholder}>{orgState || 'TX'}</Text>
                <Text style={s.pickerArrow}>▾</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={s.label}>ZIP Code</Text>
          <TextInput style={s.input} value={postalCode} onChangeText={setPostalCode} placeholder="75001" keyboardType="numeric" maxLength={10} />
        </View>

        {/* ── Contact ──────────────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Contact Information</Text>

          <Text style={s.label}>Contact Name</Text>
          <TextInput style={s.input} value={contactName} onChangeText={setContactName} placeholder="Pastor John Smith" autoCapitalize="words" />

          <Text style={s.label}>Title / Role</Text>
          <TextInput style={s.input} value={contactTitle} onChangeText={setContactTitle} placeholder="Lead Pastor, Executive Director…" autoCapitalize="words" />

          <Text style={s.label}>Email</Text>
          <TextInput style={s.input} value={contactEmail} onChangeText={setContactEmail} placeholder="hello@yourorg.org" keyboardType="email-address" autoCapitalize="none" />

          <Text style={s.label}>Phone</Text>
          <TextInput style={s.input} value={contactPhone} onChangeText={setContactPhone} placeholder="(555) 000-0000" keyboardType="phone-pad" />

          <Text style={s.label}>Website</Text>
          <TextInput style={s.input} value={websiteUrl} onChangeText={setWebsiteUrl} placeholder="https://yourorg.org" keyboardType="url" autoCapitalize="none" />

          <Text style={s.label}>Donation / Giving Link 💛</Text>
          <Text style={s.hint}>Paste your Stripe Payment Link, PayPal.me, church giving page, or any other link. Users tap "Give" and go directly to your page — LifeVine never handles the funds.</Text>
          <TextInput style={s.input} value={donationUrl} onChangeText={setDonationUrl} placeholder="https://donate.stripe.com/your-link" keyboardType="url" autoCapitalize="none" />
        </View>

        {/* ── Social Links ─────────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Social Media</Text>

          {[
            { icon: '📘', label: 'Facebook', value: facebook, set: setFacebook, placeholder: 'https://facebook.com/yourpage' },
            { icon: '📸', label: 'Instagram', value: instagram, set: setInstagram, placeholder: '@yourhandle or URL' },
            { icon: '▶️',  label: 'YouTube',   value: youtube,   set: setYoutube,   placeholder: 'https://youtube.com/c/yourchannel' },
            { icon: '🐦', label: 'X / Twitter', value: twitter, set: setTwitter,   placeholder: '@yourhandle or URL' },
          ].map(({ icon, label, value, set, placeholder }) => (
            <View key={label}>
              <Text style={s.label}>{icon}  {label}</Text>
              <TextInput style={s.input} value={value} onChangeText={set} placeholder={placeholder} keyboardType="url" autoCapitalize="none" />
            </View>
          ))}
        </View>

        {/* ── Service Times ─────────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Hours & Service Times</Text>
          <Text style={s.hint}>When do you meet, operate, or offer services?</Text>
          <TextInput
            style={[s.input, s.inputTall]}
            value={serviceTimes}
            onChangeText={setServiceTimes}
            placeholder={"Sunday: 9:00am & 11:00am\nWednesday: Bible Study 7:00pm\nOffice Hours: Mon–Fri 9am–5pm"}
            multiline
            textAlignVertical="top"
            maxLength={1000}
          />
        </View>

        {/* ── Services Offered ──────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Services Offered</Text>
          <Text style={s.hint}>Select everything that applies to your organization.</Text>
          <View style={s.servicesGrid}>
            {SERVICES_LIST.map(svc => {
              const active = servicesOffered.includes(svc);
              return (
                <TouchableOpacity
                  key={svc}
                  style={[s.serviceChip, active && s.serviceChipActive]}
                  onPress={() => toggleService(svc)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.serviceChipText, active && s.serviceChipTextActive]}>{svc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Practice / Approach ───────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>About Our Approach</Text>
          <Text style={s.hint}>Describe your practice philosophy, treatment approach, or how your organization operates. This gives people a sense of what to expect.</Text>
          <TextInput
            style={[s.input, s.inputTall, { marginTop: 12 }]}
            value={practiceDetails}
            onChangeText={setPracticeDetails}
            placeholder="We take a Christ-centered, trauma-informed approach to counseling…"
            multiline
            textAlignVertical="top"
            maxLength={3000}
          />
        </View>

        {/* ── Pastor / Leadership ───────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Lead Pastor / Leadership</Text>
          <Text style={s.hint}>Feature the person who leads your organization. This appears prominently on your public profile.</Text>

          {/* Pastor photo */}
          <View style={s.pastorPhotoRow}>
            <TouchableOpacity style={s.pastorPhotoWrap} onPress={handlePastorImageUpload} disabled={pastorImageUploading} activeOpacity={0.85}>
              {pastorImageUrl
                ? <Image source={{ uri: pastorImageUrl }} style={s.pastorPhoto} />
                : <View style={s.pastorPhotoFallback}><Text style={s.pastorPhotoIcon}>👤</Text></View>}
              <View style={s.pastorCamBadge}>
                {pastorImageUploading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.logoCamIcon}>📷</Text>}
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Name</Text>
              <TextInput style={s.input} value={pastorName} onChangeText={setPastorName} placeholder="Pastor John Smith" autoCapitalize="words" />
              <Text style={[s.label, { marginTop: 10 }]}>Title</Text>
              <TextInput style={s.input} value={pastorTitle} onChangeText={setPastorTitle} placeholder="Lead Pastor, Senior Pastor…" autoCapitalize="words" />
            </View>
          </View>

          <Text style={s.label}>About</Text>
          <TextInput
            style={[s.input, s.inputTall]}
            value={pastorBio}
            onChangeText={setPastorBio}
            placeholder="Share a bit about their background, heart, and vision for your community…"
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />
        </View>

        {/* ── Gallery ───────────────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Photo Gallery</Text>
          <Text style={s.hint}>Up to 6 photos — your space, your community, your work in action.</Text>
          <View style={s.galleryGrid}>
            {galleryUrls.map((url, i) => (
              <TouchableOpacity
                key={i}
                style={[s.galleryCell, { width: GALLERY_CELL, height: GALLERY_CELL }]}
                onPress={() => url ? removeGallery(i) : handleGalleryUpload(i)}
                disabled={galleryUploading === i}
                activeOpacity={0.8}
              >
                {url ? (
                  <>
                    <Image source={{ uri: url }} style={StyleSheet.absoluteFill} />
                    <View style={s.galleryRemoveBadge}><Text style={s.galleryRemoveIcon}>×</Text></View>
                  </>
                ) : galleryUploading === i ? (
                  <ActivityIndicator color="#2D6A4F" />
                ) : (
                  <Text style={s.galleryAddIcon}>+</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.hint}>Tap a photo to remove it · Tap + to add</Text>
        </View>

        {/* ── Tags ──────────────────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Tags</Text>
          <Text style={s.hint}>Comma-separated keywords that help people find you.</Text>
          <TextInput style={[s.input, { marginTop: 12 }]} value={tagsInput} onChangeText={setTagsInput} placeholder="food pantry, recovery, youth, counseling" autoCapitalize="none" />
        </View>

        <TouchableOpacity style={s.saveBottomBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" />
                  : <Text style={s.saveBottomText}>Save Changes</Text>}
        </TouchableOpacity>

      </ScrollView>

      <PickerModal visible={showTypePicker} title="Organization Type" items={ORG_TYPES.map(t => t.label)} selected={catLabel}
        onSelect={label => { const f = ORG_TYPES.find(t => t.label === label); if (f) setCategory(f.value); }} onClose={() => setShowTypePicker(false)} />
      <PickerModal visible={showDenomPicker} title="Denomination" items={DENOMINATIONS} selected={denomination}
        onSelect={setDenomination} onClose={() => setShowDenomPicker(false)} />
      <PickerModal visible={showStatePicker} title="State" items={US_STATES} selected={orgState}
        onSelect={setOrgState} onClose={() => setShowStatePicker(false)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#F5F0E8' },
  scroll:     { paddingBottom: 56 },
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  denied:     { fontSize: 15, color: '#A8A29E', textAlign: 'center' },
  saveBtn:    { paddingHorizontal: 4 },
  saveBtnText:{ fontSize: 15, color: '#2D6A4F', fontWeight: '700' },

  // Visual / banner + logo
  visualSection: { marginBottom: 60 },
  bannerSlot: { width: '100%', backgroundColor: '#E8F5E9', overflow: 'hidden', justifyContent: 'flex-end' },
  bannerFallback: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  bannerFallbackIcon: { fontSize: 40 },
  bannerFallbackText: { fontSize: 13, color: '#A8A29E' },
  bannerOverlay: {
    backgroundColor: 'rgba(0,0,0,0.32)', paddingVertical: 8, paddingHorizontal: 14,
    alignSelf: 'flex-end', margin: 10, borderRadius: 8,
  },
  bannerOverlayText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  logoWrap: { position: 'absolute', bottom: -44, left: 20 },
  logoImg: { width: 88, height: 88, borderRadius: 44, borderWidth: 4, borderColor: '#F5F0E8' },
  logoFallback: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: '#E8F5E9',
    alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#F5F0E8',
  },
  logoFallbackIcon: { fontSize: 38 },
  logoCamBadge: {
    position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#2D6A4F', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#F5F0E8',
  },
  logoCamIcon: { fontSize: 13 },
  logoHint: { position: 'absolute', bottom: -68, left: 122, fontSize: 12, color: '#A8A29E' },

  // Card
  card:         { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginHorizontal: 16, marginBottom: 14 },
  cardTitle:    { fontSize: 11, fontWeight: '800', color: '#A8A29E', textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 4 },

  // Fields
  label:        { fontSize: 13, fontWeight: '700', color: '#57534E', marginTop: 14, marginBottom: 5 },
  hint:         { fontSize: 12, color: '#A8A29E', marginBottom: 6, lineHeight: 17 },
  input:        { borderWidth: 1, borderColor: '#E5DDD4', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#FEFCF8', color: '#1C1917' },
  inputMid:     { minHeight: 80, textAlignVertical: 'top' },
  inputTall:    { minHeight: 130, textAlignVertical: 'top' },
  row:          { flexDirection: 'row', gap: 12, alignItems: 'flex-end' },
  pickerRow:    { borderWidth: 1, borderColor: '#E5DDD4', borderRadius: 10, padding: 12, backgroundColor: '#FEFCF8', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerVal:    { fontSize: 15, color: '#1C1917' },
  pickerPlaceholder: { fontSize: 15, color: '#A8A29E' },
  pickerArrow:  { fontSize: 14, color: '#A8A29E' },

  // Services
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  serviceChip:  { borderWidth: 1.5, borderColor: '#E5DDD4', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FEFCF8' },
  serviceChipActive: { borderColor: '#2D6A4F', backgroundColor: '#E8F5E9' },
  serviceChipText: { fontSize: 13, color: '#78716C' },
  serviceChipTextActive: { color: '#2D6A4F', fontWeight: '700' },

  // Pastor
  pastorPhotoRow: { flexDirection: 'row', gap: 16, marginBottom: 4, alignItems: 'flex-start' },
  pastorPhotoWrap: { position: 'relative' },
  pastorPhoto:  { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#F5F0E8' },
  pastorPhotoFallback: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#F5F0E8' },
  pastorPhotoIcon: { fontSize: 36 },
  pastorCamBadge: { position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: '#2D6A4F', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#F5F0E8' },

  // Gallery
  galleryGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  galleryCell:  { borderRadius: 10, overflow: 'hidden', backgroundColor: '#F5F0E8', borderWidth: 1.5, borderColor: '#E5DDD4', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
  galleryRemoveBadge: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  galleryRemoveIcon: { color: '#fff', fontSize: 16, lineHeight: 20, fontWeight: '700' },
  galleryAddIcon: { fontSize: 28, color: '#C4B9AF' },

  // Save
  saveBottomBtn:  { backgroundColor: '#2D6A4F', borderRadius: 14, marginHorizontal: 16, marginTop: 8, paddingVertical: 16, alignItems: 'center' },
  saveBottomText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
});

const picker = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#FEFCF8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0EBE4', backgroundColor: '#FFFFFF' },
  title:  { fontSize: 16, fontWeight: '700', color: '#1C1917' },
  done:   { fontSize: 15, color: '#2D6A4F', fontWeight: '700' },
  row:    { paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F5F0E8', flexDirection: 'row', alignItems: 'center' },
  rowActive: { backgroundColor: '#F0FDF4' },
  rowText: { flex: 1, fontSize: 15, color: '#1C1917' },
  rowTextActive: { color: '#2D6A4F', fontWeight: '700' },
  check:  { fontSize: 16, color: '#2D6A4F', fontWeight: '700' },
});
