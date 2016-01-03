__author__ = 'sean'

import unittest
import requests

class MyTestCase(unittest.TestCase):
    def test_something(self):
        target_url = "http://ec2-52-30-116-78.eu-west-1.compute.amazonaws.com:17142/static"
        r = requests.post(target_url, stream=True)

        self.assertEqual(200, r.status_code)

        with open("testoutput.png", 'wb') as fd:
            for chunk in r.iter_content(1024):
                fd.write(chunk)


if __name__ == '__main__':
    unittest.main()
