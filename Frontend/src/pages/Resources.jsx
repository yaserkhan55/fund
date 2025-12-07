import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function Resources() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("tips");
  
  // Add fade-in animation
  React.useEffect(() => {
    document.body.style.opacity = '1';
  }, []);

  const fundraisingTips = [
    {
      title: "Write a Compelling Story",
      description: "Share the real story behind your campaign. Be honest, emotional, and specific about the need.",
      icon: "📝",
    },
    {
      title: "Set a Realistic Goal",
      description: "Break down your goal amount and explain how each rupee will be used. Transparency builds trust.",
      icon: "🎯",
    },
    {
      title: "Use High-Quality Images",
      description: "Add clear, relevant photos that tell your story. Images help donors connect with your cause.",
      icon: "📸",
    },
    {
      title: "Share Regularly",
      description: "Update your campaign regularly. Share progress, thank donors, and keep momentum going.",
      icon: "📢",
    },
    {
      title: "Engage with Donors",
      description: "Respond to comments, thank donors personally, and show appreciation for their support.",
      icon: "💬",
    },
    {
      title: "Leverage Social Media",
      description: "Share your campaign on WhatsApp, Facebook, Instagram, and other platforms to reach more people.",
      icon: "📱",
    },
  ];

  const bestPractices = [
    {
      title: "Be Transparent",
      description: "Clearly explain how funds will be used. Provide updates and receipts when possible.",
      icon: "🔍",
    },
    {
      title: "Provide Updates",
      description: "Regular updates show progress and build trust. Share milestones and achievements.",
      icon: "📊",
    },
    {
      title: "Show Gratitude",
      description: "Thank every donor personally. Gratitude encourages more donations and builds community.",
      icon: "🙏",
    },
    {
      title: "Be Patient",
      description: "Fundraising takes time. Stay consistent, keep sharing, and don't give up.",
      icon: "⏳",
    },
  ];

  const faqs = [
    {
      q: "How do I create a successful campaign?",
      a: "Start with a clear, honest story. Set a realistic goal, add quality images, and share your campaign widely on social media. Regular updates and engagement with donors are key to success.",
    },
    {
      q: "What information do I need to provide?",
      a: "You'll need: beneficiary details, medical/educational documents (if applicable), clear photos, a compelling story, and a breakdown of how funds will be used.",
    },
    {
      q: "How long does campaign approval take?",
      a: "Our team reviews campaigns within 24-48 hours. Make sure all required documents are uploaded to avoid delays.",
    },
    {
      q: "Can I edit my campaign after it's live?",
      a: "Yes! You can update your campaign story, add images, and provide progress updates from your dashboard.",
    },
    {
      q: "How do I receive the funds?",
      a: "Funds are transferred securely to your registered bank account. You'll receive notifications about each donation.",
    },
    {
      q: "Is there a fee for using the platform?",
      a: "We charge a small platform fee to cover payment processing and operational costs. This is clearly displayed when creating your campaign.",
    },
    {
      q: "What makes a campaign successful?",
      a: "Successful campaigns have: compelling stories, clear goals, regular updates, active sharing on social media, and genuine engagement with donors.",
    },
    {
      q: "Can I raise funds for someone else?",
      a: "Yes, you can create campaigns for family members, friends, or anyone in need. Make sure you have their consent and necessary documents.",
    },
  ];

  const quickLinks = [
    { title: "Create a Campaign", link: "/create-campaign", icon: "🚀" },
    { title: "Browse Fundraisers", link: "/browse", icon: "🔍" },
    { title: "Success Stories", link: "/#success-stories", icon: "⭐" },
    { title: "Contact Support", link: "/#contact", icon: "💬" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1FAFA] via-white to-[#E6F7F7] pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fadeInUp">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="uppercase text-xs tracking-[0.4em] text-[#00B5B8] font-semibold mb-4">
            Help & Support
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#003d3b] mb-6">
            Resources & <span className="bg-gradient-to-r from-[#00B5B8] to-[#009EA1] bg-clip-text text-transparent">Help Center</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Everything you need to create successful campaigns and make a real impact
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
          {quickLinks.map((link, idx) => (
            <Link
              key={idx}
              to={link.link}
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 text-center border-2 border-gray-100 hover:border-[#00B5B8] group transform hover:-translate-y-2"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{link.icon}</div>
              <div className="text-sm font-bold text-[#003d3b] group-hover:text-[#00B5B8] transition-colors duration-300">
                {link.title}
              </div>
            </Link>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-3 mb-12 justify-center">
          <button
            onClick={() => setActiveTab("tips")}
            className={`px-8 py-3.5 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${
              activeTab === "tips"
                ? "bg-gradient-to-r from-[#00B5B8] to-[#009EA1] text-white shadow-xl"
                : "bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-[#00B5B8]"
            }`}
          >
            Fundraising Tips
          </button>
          <button
            onClick={() => setActiveTab("practices")}
            className={`px-8 py-3.5 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${
              activeTab === "practices"
                ? "bg-gradient-to-r from-[#00B5B8] to-[#009EA1] text-white shadow-xl"
                : "bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-[#00B5B8]"
            }`}
          >
            Best Practices
          </button>
          <button
            onClick={() => setActiveTab("faq")}
            className={`px-8 py-3.5 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${
              activeTab === "faq"
                ? "bg-gradient-to-r from-[#00B5B8] to-[#009EA1] text-white shadow-xl"
                : "bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-[#00B5B8]"
            }`}
          >
            FAQ
          </button>
        </div>

        {/* Content Sections */}
        <div className="max-w-4xl mx-auto">
          {/* Fundraising Tips */}
          {activeTab === "tips" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-[#003d3b] mb-2">
                  Fundraising Tips
                </h2>
                <p className="text-gray-600">
                  Proven strategies to maximize your campaign's success
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {fundraisingTips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-[#00B5B8] group transform hover:-translate-y-2"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{tip.icon}</div>
                    <h3 className="text-xl font-bold text-[#003d3b] mb-3 group-hover:text-[#00B5B8] transition-colors duration-300">
                      {tip.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{tip.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best Practices */}
          {activeTab === "practices" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-[#003d3b] mb-2">
                  Best Practices
                </h2>
                <p className="text-gray-600">
                  Essential guidelines for running ethical and successful campaigns
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {bestPractices.map((practice, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100 hover:border-[#00B5B8]"
                  >
                    <div className="text-4xl mb-3">{practice.icon}</div>
                    <h3 className="text-xl font-bold text-[#003d3b] mb-2">
                      {practice.title}
                    </h3>
                    <p className="text-gray-600">{practice.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ */}
          {activeTab === "faq" && (
            <div className="space-y-4">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-[#003d3b] mb-2">
                  Frequently Asked Questions
                </h2>
                <p className="text-gray-600">
                  Find answers to common questions about fundraising
                </p>
              </div>
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100"
                >
                  <h3 className="text-lg font-bold text-[#003d3b] mb-3">
                    {faq.q}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-[#00B5B8] to-[#009EA1] rounded-2xl p-8 text-white shadow-xl">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Your Campaign?</h2>
            <p className="text-lg mb-6 opacity-90">
              Create your fundraiser today and make a real difference
            </p>
            <Link
              to="/create-campaign"
              className="inline-block bg-white text-[#00B5B8] px-8 py-3 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start a Fundraiser →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

