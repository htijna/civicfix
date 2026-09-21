import LocalAuthority from '../models/LocalAuthority.js';

// @desc    Get all local authorities
// @route   GET /api/local-authorities
// @access  Private (Admin/Department)
export const getLocalAuthorities = async (req, res) => {
  try {
    const authorities = await LocalAuthority.find();
    res.json(authorities);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get local authority by ID
// @route   GET /api/local-authorities/:id
// @access  Private (Admin)
export const getLocalAuthorityById = async (req, res) => {
  try {
    const authority = await LocalAuthority.findById(req.params.id);
    if (authority) {
      res.json(authority);
    } else {
      res.status(404).json({ message: 'Local Authority not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new local authority
// @route   POST /api/local-authorities
// @access  Private (Admin)
export const createLocalAuthority = async (req, res) => {
  const { name, code, district, state, boundary, status } = req.body;

  try {
    const authorityExists = await LocalAuthority.findOne({ code });

    if (authorityExists) {
      return res.status(400).json({ message: 'Local Authority with this code already exists' });
    }

    const authority = await LocalAuthority.create({
      name,
      code,
      district,
      state,
      boundary,
      status
    });

    res.status(201).json(authority);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error: error.message });
  }
};

// @desc    Update a local authority
// @route   PUT /api/local-authorities/:id
// @access  Private (Admin)
export const updateLocalAuthority = async (req, res) => {
  try {
    const authority = await LocalAuthority.findById(req.params.id);

    if (authority) {
      authority.name = req.body.name || authority.name;
      authority.code = req.body.code || authority.code;
      authority.district = req.body.district || authority.district;
      authority.state = req.body.state || authority.state;
      authority.boundary = req.body.boundary || authority.boundary;
      authority.status = req.body.status !== undefined ? req.body.status : authority.status;

      const updatedAuthority = await authority.save();
      res.json(updatedAuthority);
    } else {
      res.status(404).json({ message: 'Local Authority not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error: error.message });
  }
};

// @desc    Delete a local authority
// @route   DELETE /api/local-authorities/:id
// @access  Private (Admin)
export const deleteLocalAuthority = async (req, res) => {
  try {
    const authority = await LocalAuthority.findById(req.params.id);

    if (authority) {
      await authority.deleteOne();
      res.json({ message: 'Local Authority removed' });
    } else {
      res.status(404).json({ message: 'Local Authority not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
