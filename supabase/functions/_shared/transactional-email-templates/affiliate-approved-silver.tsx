/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  first_name?: string
  code?: string
  link?: string
  commission_percent?: number | string
  discount_percent?: number | string
}

const SITE = 'https://ntygear.com'

const Email = ({ first_name, code, link, commission_percent, discount_percent }: Props) => {
  const name = first_name?.trim() || 'there'
  const commission = commission_percent ?? 15
  const discount = discount_percent ?? 10
  const affLink = link || `${SITE}/?ref=${code || 'YOURCODE'}`
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Welcome to Silver — Your Natty Apparel Affiliate Account Is Live</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={brand}>NATTY APPAREL</Heading>
          <Text style={tierBadge}>TIER · SILVER</Text>
          <Heading style={h1}>You're In — Welcome to Silver</Heading>
          <Text style={text}>Hey {name},</Text>
          <Text style={text}>
            Your affiliate application has been approved at <strong>Silver · {commission}% commission</strong>.
            Your code gives customers <strong>{discount}% off</strong>.
          </Text>
          <Text style={highlight}>
            Your referral code: <strong>{code || 'YOURCODE'}</strong>
            <br />
            Your affiliate link: <a href={affLink} style={linkStyle}>{affLink}</a>
          </Text>

          <Text style={h2}>Your links</Text>
          <Text style={bullet}>• Affiliate dashboard: <a href={`${SITE}/account?tab=affiliate`} style={linkStyle}>{SITE}/account?tab=affiliate</a></Text>
          <Text style={bullet}>• Partner portal: <a href={`${SITE}/partners`} style={linkStyle}>{SITE}/partners</a></Text>
          <Text style={bullet}>• Brand & asset kit: <a href={`${SITE}/partners#assets`} style={linkStyle}>{SITE}/partners#assets</a></Text>
          <Text style={bullet}>• Shop the drop: <a href={`${SITE}/shop`} style={linkStyle}>{SITE}/shop</a></Text>
          <Text style={bullet}>• Priority support: <a href="mailto:support@ntyapparel.com" style={linkStyle}>support@ntyapparel.com</a></Text>

          <Text style={h2}>Climb to Gold</Text>
          <Text style={bullet}>• Hit $10,000+ GMV (30-day rolling) to unlock <strong>Gold · 20%</strong></Text>

          <Text style={text}>Track clicks, sales, and commissions live from your dashboard.</Text>
          <Text style={text}>Stay real. Stay natty.</Text>
          <Text style={signoff}>— The Natty Apparel Team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: "You're In — Welcome to Silver · Natty Apparel Affiliate",
  displayName: 'Affiliate Approved — Silver',
  previewData: { first_name: 'Alex', code: 'ALEX10', link: 'https://ntygear.com/?ref=ALEX10', commission_percent: 15, discount_percent: 10 },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brand = { fontSize: '14px', letterSpacing: '0.2em', color: '#000', margin: '0 0 12px', fontWeight: 800 }
const tierBadge = { fontSize: '11px', letterSpacing: '0.3em', color: '#3a3a3a', backgroundColor: '#e6e6e6', padding: '6px 10px', display: 'inline-block', margin: '0 0 16px', fontWeight: 700 }
const h1 = { fontSize: '22px', lineHeight: '1.3', color: '#000', margin: '0 0 20px', fontWeight: 700 }
const h2 = { fontSize: '13px', letterSpacing: '0.18em', color: '#000', margin: '20px 0 8px', fontWeight: 700, textTransform: 'uppercase' as const }
const text = { fontSize: '15px', lineHeight: '1.6', color: '#1a1a1a', margin: '0 0 10px' }
const bullet = { fontSize: '14px', lineHeight: '1.7', color: '#1a1a1a', margin: '0 0 4px' }
const highlight = { fontSize: '15px', lineHeight: '1.6', color: '#1a1a1a', margin: '8px 0 14px', padding: '12px 16px', backgroundColor: '#f5f5f5', borderRadius: '6px' }
const linkStyle = { color: '#000', textDecoration: 'underline' }
const signoff = { fontSize: '15px', lineHeight: '1.6', color: '#000', margin: '16px 0 0', fontWeight: 600 }
