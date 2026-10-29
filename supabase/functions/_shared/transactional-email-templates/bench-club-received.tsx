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
}

const Email = ({ first_name }: Props) => {
  const name = first_name?.trim() || 'there'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your lift has been submitted. Here’s what happens next.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={brand}>NATTY APPAREL</Heading>
          <Text style={text}>Hey {name},</Text>
          <Text style={text}>We’ve received your Natty Verified application!</Text>
          <Text style={text}>
            Our team will review your submission to ensure it meets our verification standards.
          </Text>
          <Text style={text}>
            We do our best to review applications within 48 hours, although high submission volume
            can occasionally cause delays.
          </Text>
          <Text style={text}>You’ll receive another email once your application has been reviewed.</Text>
          <Text style={text}>
            Once approved, you’ll officially unlock access to our exclusive Natty Verified apparel.
          </Text>
          <Heading as="h2" style={sectionHeading}>YOUR MEMBER DASHBOARD</Heading>
          <Text style={text}>
            Visit your dashboard to track your submissions, view your verification status, and submit new lifts.
          </Text>
          <Text style={text}>
            <a href="https://login.ntygear.com/auth">View your dasboard</a>
          </Text>
          <Text style={signoff}>Stay Real. Stay Natty.</Text>
          <Text style={text}>The Natty Team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: 'We’ve Received Your Natty Verified Application',
  displayName: 'Natty Verified — Application Received',
  previewData: { first_name: 'Alex' },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
}
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brand = { fontSize: '14px', letterSpacing: '0.2em', color: '#000', margin: '0 0 24px', fontWeight: 800 }
const sectionHeading = { fontSize: '16px', lineHeight: '1.4', color: '#000', margin: '24px 0 10px', fontWeight: 700 }
const text = { fontSize: '15px', lineHeight: '1.6', color: '#1a1a1a', margin: '0 0 12px' }
const signoff = { fontSize: '15px', lineHeight: '1.6', color: '#000', margin: '20px 0 12px', fontWeight: 600 }
