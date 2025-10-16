import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect the root path to the static landing page in /public
  redirect('/landing.html')
}
