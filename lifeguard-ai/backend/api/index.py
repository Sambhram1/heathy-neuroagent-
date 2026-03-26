import os
import sys

# Ensure backend package imports resolve when executed by Vercel runtime.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
