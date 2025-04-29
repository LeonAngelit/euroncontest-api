const nodemailer = require("nodemailer");
const conf = require('../config/config');

class EmailService {
  constructor() {}
  async sendConfirmEmail(data, receiver) {
    try{
      let transporter = nodemailer.createTransport({
        host: `${conf.mailServer}`,
        port: 465,
        secure: true, 
  
        auth: {
          user: `${conf.userMail}`,
          pass: `${conf.mailPass}`,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
  
       await transporter.sendMail({
        from: `${data.name}" <${conf.userMail}>`, // sender address
        to: receiver, // list of receivers
        subject: `${data.subject}`, // Subject line
        html: `${data.htmlBody}`, // html body
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',  // Ensure proper encoding
        },
      });
  
      return 1

    } catch(err){
      return err.message
    }

  }
}

module.exports= EmailService;
