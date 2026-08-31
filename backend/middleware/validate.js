import { validationResult } from 'express-validator';

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation failed:', errors.array());
    return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
  }
  next();
}
