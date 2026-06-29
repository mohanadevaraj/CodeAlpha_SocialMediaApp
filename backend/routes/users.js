const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');

// GET /api/users/:username — public profile
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password')
      .populate('followers', 'username fullName avatar')
      .populate('following', 'username fullName avatar');

    if (!user) return res.status(404).json({ message: 'User not found' });

    const posts = await Post.find({ author: user._id })
      .sort('-createdAt')
      .populate('author', 'username fullName avatar')
      .populate('comments.user', 'username avatar');

    res.json({ user, posts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/profile/update — update own profile
router.put('/profile/update', protect, async (req, res) => {
  try {
    const { fullName, bio, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (fullName !== undefined) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/:id/follow — follow or unfollow
router.post('/:id/follow', protect, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    const isFollowing = currentUser.following.includes(targetUser._id);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUser._id.toString()
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUser._id.toString()
      );
    } else {
      // Follow
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);
    }

    await currentUser.save();
    await targetUser.save();

    res.json({ following: !isFollowing, followersCount: targetUser.followers.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users — search users
router.get('/', async (req, res) => {
  try {
    const query = req.query.search || '';
    const users = await User.find({
      username: { $regex: query, $options: 'i' },
    }).select('username fullName avatar followers').limit(20);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;