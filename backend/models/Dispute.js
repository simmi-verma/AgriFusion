const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    required: true 
  },
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  farmerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  reason: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'resolved'], 
    default: 'pending' 
  },
  complaints: [
    {
      sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
      },
      message: { 
        type: String, 
        required: true 
      },
      createdAt: { 
        type: Date, 
        default: Date.now 
      }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Dispute', disputeSchema);
