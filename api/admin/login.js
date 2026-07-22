export default async function handler(_req, res) {
  res.setHeader('Cache-Control', 'no-store')
  return res.status(410).json({
    error: 'Gone',
    message: 'Use https://admin.royalnordic.fi with Supabase Auth.',
  })
}
