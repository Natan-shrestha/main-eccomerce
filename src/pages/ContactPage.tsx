import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-gradient-warm">
      <div className="container mx-auto px-4 py-16">

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-6">Contact Us</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We'd love to hear from you. Get in touch with our team for any questions or to schedule a consultation.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Map Card (replacing Send us a Message) */}
        <Card className="bg-gradient-card border-border/50 shadow-luxury overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground">Our Location</CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[600px]">
            <iframe
              title="Kathmandu Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3532.7391086013956!2d85.32062531505582!3d27.71724598279695!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb19920a3b91ef%3A0xa5039f318dbde6bc!2sKathmandu!5e0!3m2!1sen!2snp!4v1691667964852!5m2!1sen!2snp"
              width="100%"
              height="140%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </CardContent>
        </Card>


          {/* Contact Information */}
          <div className="space-y-8">
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <MapPin className="h-6 w-6 text-accent-deep mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Visit Our Showroom</h3>
                    <p className="text-muted-foreground">
                      456 Kathmandu Street<br />
                      New Baneshwor, Kathmandu<br />
                      Nepal
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Phone className="h-6 w-6 text-accent-deep mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Call Us</h3>
                    <p className="text-muted-foreground">
                      Main: +977 9800000000<br />
                      Customer Service: +977 9801111111<br />
                      Toll-free: 1660-01-12345
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 text-accent-deep mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Email Us</h3>
                    <p className="text-muted-foreground">
                      General: info@brotherwoodnepal.com<br />
                      Sales: sales@brotherwoodnepal.com<br />
                      Support: support@brotherwoodnepal.com
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Clock className="h-6 w-6 text-accent mt-1 animate-pulse" />
                  <div className="w-full">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Business Hours</h3>
                    <div className="divide-y divide-border/30 text-sm text-muted-foreground">
                      {[
                        ['Monday – Friday', '9:00 AM – 8:00 PM'],
                        ['Saturday', '10:00 AM – 6:00 PM'],
                        ['Sunday', '12:00 PM – 5:00 PM'],
                      ].map(([day, time]) => (
                        <div key={day} className="flex justify-between items-center py-2 group">
                          <span>{day}</span>
                          <span className="font-medium text-foreground transition group-hover:translate-x-1">
                            {time}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
