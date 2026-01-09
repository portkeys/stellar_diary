// Minimal test - no imports initially
export default async (req: any, res: any) => {
  res.status(200).json({ test: 'minimal function works', path: req.url });
};
