import React, { useState, useRef } from 'react';
import { Calendar, Clock, User, Mail, Phone, Home, Info, Send, MapPin, Globe, MessageCircle, PenTool, X, Facebook, Instagram } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { jsPDF } from 'jspdf';
import { useForm } from 'react-hook-form';

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  passport: string;
  nationality: string;
  viewingRoom: string;
  viewingDate: string;
  viewingTime: string;
  questions: string;
};

const generatePDF = (data: any, signatureBase64: string) => {
  const doc = new jsPDF();
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.setTextColor(0, 40, 85);
  doc.setFont("helvetica", "bold");
  doc.text("WhiteCloud Homestay Viewing Request", 20, y);
  y += 15;

  // Personal Details
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Personal Details", 20, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${data.firstName} ${data.lastName}`, 20, y); y += 7;
  doc.text(`Email: ${data.email}`, 20, y); y += 7;
  doc.text(`Phone: ${data.phone}`, 20, y); y += 7;
  doc.text(`Passport: ${data.passport}`, 20, y); y += 7;
  doc.text(`Nationality: ${data.nationality}`, 20, y); y += 12;

  // Viewing Preferences
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Viewing Preferences", 20, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Room: ${data.viewingRoom}`, 20, y); y += 7;
  doc.text(`Date: ${data.viewingDate}`, 20, y); y += 7;
  doc.text(`Time: ${data.viewingTime}`, 20, y); y += 12;

  // Additional Information
  if (data.questions) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Additional Information", 20, y);
    y += 8;
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const splitQuestions = doc.splitTextToSize(`Questions: ${data.questions}`, 170);
    doc.text(splitQuestions, 20, y);
    y += (splitQuestions.length * 7) + 12;
  }

  // Terms and Conditions
  doc.addPage();
  y = 15;
  doc.setFontSize(15);
  doc.setTextColor(0, 40, 85);
  doc.setFont("helvetica", "bold");
  doc.text("Room Viewing Terms and Conditions", 20, y);
  y += 10;

  doc.setTextColor(0, 0, 0);
  
  const sections = [
    {
      title: "Scheduling and Punctuality",
      items: [
        "By Appointment Only: Viewings are by prior appointment. We may not be able to accommodate walk-in to respect the privacy of current occupants.",
        "Arrival Time: Please arrive no more than 10 minutes before your scheduled slot. If you are running more than 15 minutes late, the viewing may be cancelled or rescheduled.",
        "Cancellations: If you cannot make it, please provide at least 24 hours' notice."
      ]
    },
    {
      title: "Identification and Safety",
      items: [
        "Verification: For security purposes, we reserves the right to request a valid photo ID (Driver's License or Passport) before granting entry.",
        "No Unauthorised Guests: Only the person(s) registered for the viewing may enter. Please do not bring additional friends or family members without prior approval."
      ]
    },
    {
      title: "Conduct During the Viewing",
      items: [
        "Privacy First: Viewers are permitted to see the requested bedroom and all communal areas (kitchen, living room, shared bathrooms). Access to other occupied bedrooms is strictly prohibited.",
        "Respect the Space: Please refrain from sitting on furniture, opening drawers/closets containing personal belongings (unless specified), or using the bathroom facilities.",
        "Footwear Policy: To keep communal floors clean, please remove your shoes at the front door and use the shoe rack provided.",
        "No Smoking: Smoking or vaping is strictly prohibited inside the property and within the immediate vicinity of the entrance.",
        "Zero Tolerance: Any disrespectful, aggressive, or discriminatory behavior toward the current occupants will result in an immediate termination of the viewing."
      ]
    },
    {
      title: "Privacy and Media",
      items: [
        "Photography/Video: To protect the personal belongings and privacy of the current occupants, photography, video recording, or \"live-streaming\" inside the house is strictly prohibited.",
        "Confidentiality: Any personal information observed during the viewing (e.g., mail, photos) must be kept confidential."
      ]
    },
    {
      title: "Liability",
      items: [
        "Personal Injury: We are not liable for any accidents, injuries, or illnesses sustained during the viewing.",
        "Personal Property: We are not responsible for the loss or damage of any personal items brought into the property by the viewer.",
        "Damages: The viewer assumes full financial responsibility for any damage caused to the property or its contents during the viewing."
      ]
    }
  ];

  sections.forEach(sec => {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(sec.title, 20, y);
    y += 5;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    sec.items.forEach(item => {
      const lines = doc.splitTextToSize(`• ${item}`, 170);
      doc.text(lines, 20, y);
      y += lines.length * 4.5;
    });
    y += 3;
  });

  // Signature
  y += 5;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Agreed and Signed:", 20, y);
  y += 5;
  
  if (signatureBase64) {
    // Add a subtle border/background for the signature area
    doc.setDrawColor(200, 200, 200);
    doc.rect(20, y, 70, 25);
    doc.addImage(signatureBase64, 'PNG', 20, y, 70, 25);
    
    y += 30;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
    doc.text(`Signed digitally on: ${dateStr}`, 20, y);
  }

  return doc.output('datauristring');
};

export default function App() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [sigError, setSigError] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [pendingData, setPendingData] = useState<FormValues | null>(null);
  const sigCanvas = useRef<SignatureCanvas>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    mode: 'onChange'
  });

  const onSubmit = async (data: FormValues) => {
    if (sigCanvas.current?.isEmpty()) {
      setSigError(true);
      return;
    }
    setSigError(false);
    setPendingData(data);
    setShowVerification(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingData) return;
    setIsSubmitting(true);

    const signatureBase64 = sigCanvas.current?.toDataURL() || '';
    
    // Generate PDF document (including signature)
    const pdfBase64 = generatePDF(pendingData, signatureBase64);

    try {
      // Send submission to our backend (which handles both webhook and email)
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: pendingData.email,
          name: pendingData.firstName,
          pdfBase64: pdfBase64,
          formData: pendingData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      setShowVerification(false);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-semibold text-[#002855]">Request Sent!</h2>
          <p className="text-slate-600">
            Thank you for your interest in WhiteCloud Homestay. We've received your viewing request and will be in touch shortly to confirm the details.
          </p>
          <button 
            onClick={() => setIsSubmitted(false)}
            className="mt-6 px-6 py-2 bg-[#002855] text-white rounded-lg hover:bg-[#002855]/90 transition-colors"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-t-2xl shadow-sm overflow-hidden mb-6">
          <div className="h-32 bg-gradient-to-r from-[#002855] to-[#004080]"></div>
          <div className="px-8 pt-8 pb-8 relative">
            <div className="absolute -top-12 left-8 w-24 h-24 bg-white rounded-2xl shadow-md flex flex-col items-center justify-center border-4 border-white p-2">
              <svg viewBox="0 0 100 60" className="w-12 h-8 mb-1">
                <path d="M 25 50 Q 15 50 15 40 Q 15 30 25 30 Q 30 15 50 15 Q 70 15 75 30 Q 85 30 85 40 Q 85 50 75 50" stroke="#42B4E6" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="text-[#002855] font-serif italic font-bold text-[10px] leading-none">white cloud</div>
              <div className="text-[#002855] font-sans font-bold text-[6px] tracking-widest mt-0.5">HOMESTAY</div>
            </div>
            <div className="mt-8">
              <h1 className="text-3xl font-bold text-[#002855] mb-2">WhiteCloud Homestay Viewing</h1>
              <p className="text-slate-600 leading-relaxed mb-6">
                Welcome to WhiteCloud Homestay! We offer a homely environment to stay while taking a break from travelling. You will be sharing with like-minded travellers in a shared house situation with 5 bedrooms.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 bg-sky-50/50 p-4 rounded-xl border border-sky-100">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#42B4E6] shrink-0 mt-0.5" />
                    <span>Short walk to Bishopdale Village Mall (library, PostShop, ATMs, New World supermarket, cafes). 8 mins drive from Christchurch airport.</span>
                  </div>
                  <a href="https://maps.app.goo.gl/nipfuViF6ye2a4wd8" target="_blank" rel="noreferrer" className="inline-block text-[#42B4E6] hover:text-[#002855] transition-colors ml-8 font-medium underline underline-offset-2">
                    View on Google Maps
                  </a>
                </div>
                <div className="flex flex-col gap-3">
                  <a href="https://whitecloudhomes.netlify.app/" target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-[#002855] transition-colors">
                    <Globe className="w-5 h-5 text-[#42B4E6] shrink-0" />
                    <span>whitecloudhomes.netlify.app</span>
                  </a>
                  <a href="https://wa.me/message/QKHUHJ5Y273HL1" target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-[#002855] transition-colors">
                    <MessageCircle className="w-5 h-5 text-[#42B4E6] shrink-0" />
                    <span>Contact Us on WhatsApp</span>
                  </a>
                  <a href="https://www.facebook.com/profile.php?id=61551048270198" target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-[#002855] transition-colors">
                    <Facebook className="w-5 h-5 text-[#42B4E6] shrink-0" />
                    <span>Follow us on Facebook</span>
                  </a>
                  <a href="https://www.instagram.com/whitecloud_homes" target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-[#002855] transition-colors">
                    <Instagram className="w-5 h-5 text-[#42B4E6] shrink-0" />
                    <span>Follow us on Instagram</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-sm p-8 space-y-8">
          
          {/* Personal Details */}
          <section>
            <h3 className="text-lg font-semibold text-[#002855] mb-4 flex items-center gap-2 border-b border-sky-100 pb-2">
              <User className="w-5 h-5 text-[#42B4E6]" />
              Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">First Name *</label>
                <input 
                  {...register("firstName", { required: "First name is required" })}
                  type="text" 
                  id="firstName" 
                  className={`w-full px-4 py-2 border ${errors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-[#002855]'} rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all`} 
                  placeholder="Jane" 
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">Last Name *</label>
                <input 
                  {...register("lastName", { required: "Last name is required" })}
                  type="text" 
                  id="lastName" 
                  className={`w-full px-4 py-2 border ${errors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-[#002855]'} rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all`} 
                  placeholder="Doe" 
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email Address *</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-[#42B4E6] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    {...register("email", { 
                      required: "Email is required",
                      pattern: {
                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                        message: "Please enter a valid email address"
                      }
                    })}
                    type="email" 
                    id="email" 
                    className={`w-full pl-10 pr-4 py-2 border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-[#002855]'} rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all`} 
                    placeholder="jane@example.com" 
                  />
                </div>
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Phone / WhatsApp *</label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-[#42B4E6] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    {...register("phone", { required: "Phone number is required" })}
                    type="tel" 
                    id="phone" 
                    className={`w-full pl-10 pr-4 py-2 border ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-[#002855]'} rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all`} 
                    placeholder="+64 21 000 0000" 
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="passport" className="block text-sm font-medium text-slate-700">Passport Number *</label>
                <input 
                  {...register("passport", { required: "Passport number is required" })}
                  type="text" 
                  id="passport" 
                  className={`w-full px-4 py-2 border ${errors.passport ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-[#002855]'} rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all`} 
                  placeholder="AB123456" 
                />
                {errors.passport && <p className="text-red-500 text-sm mt-1">{errors.passport.message}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="nationality" className="block text-sm font-medium text-slate-700">Nationality *</label>
                <div className="relative">
                  <Globe className="w-5 h-5 text-[#42B4E6] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    {...register("nationality", { required: "Nationality is required" })}
                    type="text" 
                    id="nationality" 
                    className={`w-full pl-10 pr-4 py-2 border ${errors.nationality ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-[#002855]'} rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all`} 
                    placeholder="New Zealand" 
                  />
                </div>
                {errors.nationality && <p className="text-red-500 text-sm mt-1">{errors.nationality.message}</p>}
              </div>
            </div>
          </section>

          {/* Viewing Preferences */}
          <section>
            <h3 className="text-lg font-semibold text-[#002855] mb-4 flex items-center gap-2 border-b border-sky-100 pb-2">
              <Clock className="w-5 h-5 text-[#42B4E6]" />
              Viewing Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="viewingRoom" className="block text-sm font-medium text-slate-700">Viewing Room *</label>
                <div className="relative">
                  <Home className="w-5 h-5 text-[#42B4E6] absolute left-3 top-1/2 -translate-y-1/2" />
                  <select 
                    {...register("viewingRoom", { required: "Please select a room" })}
                    id="viewingRoom" 
                    className={`w-full pl-10 pr-4 py-2 border ${errors.viewingRoom ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-[#002855]'} rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all bg-white`}
                  >
                    <option value="">Select a room...</option>
                    <option value="ROOM1">ROOM1</option>
                    <option value="ROOM2">ROOM2</option>
                    <option value="ROOM3">ROOM3</option>
                    <option value="ROOM4">ROOM4</option>
                    <option value="ROOM5">ROOM5</option>
                  </select>
                </div>
                {errors.viewingRoom && <p className="text-red-500 text-sm mt-1">{errors.viewingRoom.message}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="viewingDate" className="block text-sm font-medium text-slate-700">Preferred Viewing Date *</label>
                <div className="relative">
                  <Calendar className="w-5 h-5 text-[#42B4E6] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    {...register("viewingDate", { required: "Viewing date is required" })}
                    type="date" 
                    id="viewingDate" 
                    min={new Date().toISOString().split('T')[0]} 
                    className={`w-full pl-10 pr-4 py-2 border ${errors.viewingDate ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-[#002855]'} rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all`} 
                  />
                </div>
                {errors.viewingDate && <p className="text-red-500 text-sm mt-1">{errors.viewingDate.message}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="viewingTime" className="block text-sm font-medium text-slate-700">Preferred Time *</label>
                <div className="relative">
                  <Clock className="w-5 h-5 text-[#42B4E6] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    {...register("viewingTime", { required: "Viewing time is required" })}
                    type="time" 
                    id="viewingTime" 
                    className={`w-full pl-10 pr-4 py-2 border ${errors.viewingTime ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-[#002855]'} rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all`} 
                  />
                </div>
                {errors.viewingTime && <p className="text-red-500 text-sm mt-1">{errors.viewingTime.message}</p>}
              </div>
            </div>
          </section>

          {/* Additional Info */}
          <section>
            <h3 className="text-lg font-semibold text-[#002855] mb-4 flex items-center gap-2 border-b border-sky-100 pb-2">
              <Info className="w-5 h-5 text-[#42B4E6]" />
              Additional Information
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="questions" className="block text-sm font-medium text-slate-700">Any questions or special requirements?</label>
                <textarea 
                  {...register("questions")}
                  id="questions" 
                  rows={4} 
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#002855] focus:border-transparent outline-none transition-all resize-none" 
                  placeholder="Do you have parking available?"
                ></textarea>
              </div>
            </div>
          </section>

          {/* Agreement & Signature */}
          <section>
            <h3 className="text-lg font-semibold text-[#002855] mb-4 flex items-center gap-2 border-b border-sky-100 pb-2">
              <PenTool className="w-5 h-5 text-[#42B4E6]" />
              Agreement & Signature
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                I have read and agree to the <button type="button" onClick={() => setShowTerms(true)} className="text-[#42B4E6] underline font-medium hover:text-[#002855] transition-colors">Room Viewing Terms and Conditions</button>.
              </p>
              <div className={`border-2 rounded-xl overflow-hidden bg-slate-50 ${sigError ? 'border-red-400' : 'border-slate-200'}`}>
                <SignatureCanvas 
                  ref={sigCanvas}
                  penColor="#002855"
                  canvasProps={{className: 'w-full h-40 cursor-crosshair'}}
                  onBegin={() => setSigError(false)}
                />
              </div>
              {sigError && <p className="text-red-500 text-sm">Please provide your signature.</p>}
              <div className="flex justify-end">
                <button type="button" onClick={() => sigCanvas.current?.clear()} className="text-sm text-slate-500 hover:text-slate-700 transition-colors">Clear Signature</button>
              </div>
            </div>
          </section>

          {/* Submit Button */}
          <div className="pt-4">
            <button type="submit" className="w-full bg-[#002855] text-white font-medium py-3 px-4 rounded-xl hover:bg-[#002855]/90 focus:ring-4 focus:ring-sky-200 transition-all flex items-center justify-center gap-2">
              <span>Review Request</span>
              <Send className="w-4 h-4" />
            </button>
            <p className="text-center text-xs text-slate-500 mt-4">
              By submitting this form, you agree to be contacted regarding your viewing request.
            </p>
          </div>

        </form>
      </div>

      {/* Terms and Conditions Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#002855]">Room Viewing Terms and Conditions</h2>
              <button type="button" onClick={() => setShowTerms(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-slate-600 space-y-6">
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Scheduling and Punctuality</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>By Appointment Only:</strong> Viewings are by prior appointment. We may not be able to accommodate walk-in to respect the privacy of current occupants.</li>
                  <li><strong>Arrival Time:</strong> Please arrive no more than 10 minutes before your scheduled slot. If you are running more than 15 minutes late, the viewing may be cancelled or rescheduled.</li>
                  <li><strong>Cancellations:</strong> If you cannot make it, please provide at least 24 hours' notice.</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Identification and Safety</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Verification:</strong> For security purposes, we reserves the right to request a valid photo ID (Driver's License or Passport) before granting entry.</li>
                  <li><strong>No Unauthorised Guests:</strong> Only the person(s) registered for the viewing may enter. Please do not bring additional friends or family members without prior approval.</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Conduct During the Viewing</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Privacy First:</strong> Viewers are permitted to see the requested bedroom and all communal areas (kitchen, living room, shared bathrooms). Access to other occupied bedrooms is strictly prohibited.</li>
                  <li><strong>Respect the Space:</strong> Please refrain from sitting on furniture, opening drawers/closets containing personal belongings (unless specified), or using the bathroom facilities.</li>
                  <li><strong>Footwear Policy:</strong> To keep communal floors clean, please remove your shoes at the front door and use the shoe rack provided.</li>
                  <li><strong>No Smoking:</strong> Smoking or vaping is strictly prohibited inside the property and within the immediate vicinity of the entrance.</li>
                  <li><strong>Zero Tolerance:</strong> Any disrespectful, aggressive, or discriminatory behavior toward the current occupants will result in an immediate termination of the viewing.</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Privacy and Media</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Photography/Video:</strong> To protect the personal belongings and privacy of the current occupants, photography, video recording, or "live-streaming" inside the house is strictly prohibited.</li>
                  <li><strong>Confidentiality:</strong> Any personal information observed during the viewing (e.g., mail, photos) must be kept confidential.</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Liability</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Personal Injury:</strong> We are not liable for any accidents, injuries, or illnesses sustained during the viewing.</li>
                  <li><strong>Personal Property:</strong> We are not responsible for the loss or damage of any personal items brought into the property by the viewer.</li>
                  <li><strong>Damages:</strong> The viewer assumes full financial responsibility for any damage caused to the property or its contents during the viewing.</li>
                </ul>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button type="button" onClick={() => setShowTerms(false)} className="w-full bg-[#002855] text-white py-2 rounded-lg hover:bg-[#002855]/90 transition-colors font-medium">
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerification && pendingData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#002855]">Verify Your Details</h2>
              <button type="button" onClick={() => setShowVerification(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-slate-600 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><span className="font-semibold text-slate-800">Name:</span> {pendingData.firstName} {pendingData.lastName}</div>
                <div><span className="font-semibold text-slate-800">Email:</span> {pendingData.email}</div>
                <div><span className="font-semibold text-slate-800">Phone:</span> {pendingData.phone}</div>
                <div><span className="font-semibold text-slate-800">Passport:</span> {pendingData.passport}</div>
                <div><span className="font-semibold text-slate-800">Nationality:</span> {pendingData.nationality}</div>
                <div><span className="font-semibold text-slate-800">Room:</span> {pendingData.viewingRoom}</div>
                <div><span className="font-semibold text-slate-800">Date:</span> {pendingData.viewingDate}</div>
                <div><span className="font-semibold text-slate-800">Time:</span> {pendingData.viewingTime}</div>
              </div>
              {pendingData.questions && (
                <div className="mt-4">
                  <span className="font-semibold text-slate-800">Questions/Requirements:</span>
                  <p className="mt-1 p-3 bg-slate-50 rounded-lg border border-slate-100">{pendingData.questions}</p>
                </div>
              )}
              <div className="mt-6 p-4 bg-sky-50 rounded-lg border border-sky-100">
                <p className="text-xs text-slate-600">Please verify that all details above are correct. Once confirmed, a PDF copy will be generated and sent to your email.</p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex flex-col sm:flex-row justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setShowVerification(false)} 
                disabled={isSubmitting}
                className="px-6 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-70"
              >
                Edit Details
              </button>
              <button 
                type="button" 
                onClick={handleConfirmSubmit} 
                disabled={isSubmitting}
                className="px-6 py-2 bg-[#002855] text-white rounded-lg hover:bg-[#002855]/90 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                {!isSubmitting && <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
