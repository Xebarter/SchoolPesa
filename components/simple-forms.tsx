'use client'

import { useState } from 'react'
import { registerForEvent, submitContact, submitVolunteer } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'

export function VolunteerForm() {
  const [done, setDone] = useState(false)
  if (done) return <p className="rounded-2xl bg-mist p-6 text-forest" role="status">Thank you. Your volunteer application has been received.</p>
  return (
    <form className="grid gap-4 bg-mist p-6 sm:p-8" onSubmit={(event) => {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
      void submitVolunteer({
        name: String(data.get('name') || ''),
        email: String(data.get('email') || ''),
        phone: String(data.get('phone') || ''),
        skills: String(data.get('skills') || ''),
        interest: String(data.get('interest') || ''),
        availability: String(data.get('availability') || ''),
        message: String(data.get('message') || ''),
      }).then(() => setDone(true))
    }}>
      <Label>Name<Input className="mt-2" required name="name" /></Label>
      <Label>Email<Input className="mt-2" type="email" required name="email" /></Label>
      <Label>Phone<Input className="mt-2" required name="phone" /></Label>
      <Label>Skills<Input className="mt-2" required name="skills" /></Label>
      <Label>Area of interest
        <Select className="mt-2" name="interest" defaultValue="Reading support">
          <option>Reading support</option>
          <option>Mentoring</option>
          <option>Events</option>
          <option>Finance support</option>
        </Select>
      </Label>
      <Label>Availability<Input className="mt-2" required name="availability" /></Label>
      <Label>Message<Textarea className="mt-2" required name="message" /></Label>
      <Button className="rounded-full bg-brand text-white shadow-none hover:bg-brand-deep">Submit application</Button>
    </form>
  )
}

export function ContactForm() {
  const [done, setDone] = useState(false)
  if (done) return <p className="rounded-2xl bg-mist p-6 text-forest" role="status">Message sent. We will reply by email.</p>
  return (
    <form className="grid gap-4" onSubmit={(event) => {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
      void submitContact({ name: String(data.get('name') || ''), email: String(data.get('email') || ''), message: String(data.get('message') || '') }).then(() => setDone(true))
    }}>
      <Label>Name<Input className="mt-2" name="name" required /></Label>
      <Label>Email<Input className="mt-2" name="email" type="email" required /></Label>
      <Label>Message<Textarea className="mt-2" name="message" required /></Label>
      <Button className="rounded-full bg-forest">Send message</Button>
    </form>
  )
}

export function EventRegister({ name }: { name: string }) {
  const [done, setDone] = useState(false)
  if (done) return <p className="text-sm font-semibold text-forest" role="status">You are registered for {name}.</p>
  return <Button className="rounded-full bg-forest" onClick={() => { void registerForEvent(name).then(() => setDone(true)) }}>Register</Button>
}
