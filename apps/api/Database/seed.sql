INSERT INTO templates (name, template_key, is_premium, preview_url) VALUES
  ('Modern Clean',                  'free/_mod-1',     FALSE, '/templates/free/_mod-1/preview.jpg'),
  ('Mini',                          'free/_mod-9',     FALSE, '/templates/free/_mod-9/preview.jpg'),
  ('Recruiter Friendly',            'premium/_mod-13', TRUE,  '/templates/premium/_mod-13/preview.jpg'),
  ('Executive Corporate Pink',      'premium/_mod-1',  TRUE,  '/templates/premium/_mod-1/preview.jpg'),
  ('Optimal Corporate Etudiant',    'premium/_mod-7',  TRUE,  '/templates/premium/_mod-7/preview.jpg'),
  ('ATS Optimized',                 'premium/_mod-14', TRUE,  '/templates/premium/_mod-14/preview.jpg'),
  ('Creative Chocolate',            'premium/_mod-2',  TRUE,  '/templates/premium/_mod-2/preview.jpg'),
  ('Creative Dark',                 'premium/_mod-3',  TRUE,  '/templates/premium/_mod-3/preview.jpg'),
  ('Optimal Corporate Stage',       'premium/_mod-6',  TRUE,  '/templates/premium/_mod-6/preview.jpg'),
  ('Optimal Corporate Senior',      'premium/_mod-4',  TRUE,  '/templates/premium/_mod-4/preview.jpg'),
  ('Executive Corporate Aera',      'premium/_mod-8',  TRUE,  '/templates/premium/_mod-8/preview.jpg'),
  ('Modern Minimal',                'premium/_mod-12', TRUE,  '/templates/premium/_mod-12/preview.jpg'),
  ('Professional Executive',        'premium/_mod-22', TRUE,  '/templates/premium/_mod-22/preview.jpg'),
  ('Optimal Corporate',             'premium/_mod-5',  TRUE,  '/templates/premium/_mod-5/preview.jpg'),
  ('95% ATS Optimized',             'premium/_mod-15', TRUE,  '/templates/premium/_mod-15/preview.jpg')
ON CONFLICT (template_key) DO NOTHING;
