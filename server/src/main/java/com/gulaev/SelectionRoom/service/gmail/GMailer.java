package com.gulaev.SelectionRoom.service.gmail;

import static javax.mail.Message.RecipientType.TO;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp;
import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.googleapis.json.GoogleJsonError;
import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.GmailScopes;
import com.google.api.services.gmail.model.Draft;
import com.google.api.services.gmail.model.Message;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.GeneralSecurityException;
import java.util.Properties;
import java.util.Set;
import javax.activation.DataHandler;
import javax.activation.DataSource;
import javax.activation.FileDataSource;
import javax.mail.BodyPart;
import javax.mail.MessagingException;
import javax.mail.Multipart;
import javax.mail.Session;
import javax.mail.internet.AddressException;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;
import javax.mail.util.ByteArrayDataSource;
import org.apache.commons.codec.binary.Base64;
import org.springframework.stereotype.Service;

@Service
public class GMailer {

  private final Gmail service;
  private static final String EMAIL_ADDRES = "dannysgulaev@gmail.com";

  public GMailer() throws GeneralSecurityException, IOException {
    final NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
    GsonFactory jsonFactory = GsonFactory.getDefaultInstance();
    this.service = new Gmail.Builder(httpTransport, jsonFactory, getCredentials(httpTransport, jsonFactory))
        .setApplicationName("Selection Room")
        .build();
  }

  private static Credential getCredentials(final NetHttpTransport HTTP_TRANSPORT, GsonFactory gsonFactory)
      throws IOException {
    // Load client secrets.
    GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(gsonFactory, new InputStreamReader
        (GMailer.class.getResourceAsStream("/client_secret_958656554699-1ah9d3t3hnh7vh3o9oh65cajq0thgh59.apps.googleusercontent.com.json")));
    // Build flow and trigger user authorization request.
    GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
        HTTP_TRANSPORT, gsonFactory , clientSecrets, Set.of(GmailScopes.GMAIL_SEND, GmailScopes.GMAIL_COMPOSE, GmailScopes.MAIL_GOOGLE_COM))
        .setDataStoreFactory(new FileDataStoreFactory(Paths.get("tokens").toFile()))
        .setAccessType("offline")
        .build();
    LocalServerReceiver receiver = new LocalServerReceiver.Builder().setPort(8888).build();
    Credential credential = new AuthorizationCodeInstalledApp(flow, receiver).authorize("user");
    //returns an authorized Credential object.
    return credential;
  }

  public void sendEmail(String subject, String message, String emailAddres)
      throws GeneralSecurityException, IOException, MessagingException {

    // Encode as MIME message
    Properties props = new Properties();
    Session session = Session.getDefaultInstance(props, null);
    MimeMessage email = new MimeMessage(session);

    email.setFrom(new InternetAddress(EMAIL_ADDRES));
    email.addRecipient(TO, new InternetAddress(emailAddres));
    email.setSubject(subject);
    email.setText(message);
    File file = new File("/Users/denisgulaev/Documents/projects/full stack/SelectionRoom/server/src/main/resources/logo.png");
    DataSource source = new FileDataSource(file);
    email.setDataHandler(new DataHandler(source));
//    try {
//      email.setContent(getImage());
//    } catch (Exception e) {
//      throw new RuntimeException(e);
//    }

    // Encode and wrap the MIME message into a gmail message
    ByteArrayOutputStream buffer = new ByteArrayOutputStream();
    email.writeTo(buffer);
    byte[] rawMessageBytes = buffer.toByteArray();
    String encodedEmail = Base64.encodeBase64URLSafeString(rawMessageBytes);
    Message msg = new Message();
    msg.setRaw(encodedEmail);



    try {
      // Create the draft message
//      Draft draft = new Draft();
//      draft.setMessage(msg);
//      draft = service.users().drafts().create("me", draft).execute();
//
      msg = service.users().messages().send("me", msg).execute();
      System.out.println("Message sent with ID: " + msg.getId());
      System.out.println("Draft id: " + msg.getId());
      System.out.println(msg.toPrettyString());

    } catch (GoogleJsonResponseException e) {
      // TODO(developer) - handle error appropriately
      GoogleJsonError error = e.getDetails();
      if (error.getCode() == 403) {
        System.err.println("Unable to create draft: " + e.getMessage());
      } else {
        throw e;
      }
    }
  }


  private Multipart getImage() throws Exception {
    File file = new File("/Users/denisgulaev/Documents/projects/full stack/SelectionRoom/server/src/main/resources/logo.png");
    byte[] byteArray = new byte[(int) file.length()];

    try(FileInputStream fis = new FileInputStream(file);) {
      fis.read(byteArray);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }


    Multipart multipart = new MimeMultipart();

    // Create and add the text part
//    BodyPart textPart = new MimeBodyPart();
//    textPart.setText("SR Logo");
//    multipart.addBodyPart(textPart);

    // Create and add the image part
    BodyPart imagePart = new MimeBodyPart();

    DataSource source = new ByteArrayDataSource(byteArray, "image/png"); // Change the content type if needed
    imagePart.setDataHandler(new DataHandler(source));
    imagePart.setFileName("image.jpg"); // Set a suitable file name
    imagePart.setHeader("Content-ID", "<image>"); // Use a unique identifier for the image
    imagePart.setDisposition(MimeBodyPart.INLINE);
    multipart.addBodyPart(imagePart);
    return multipart;
  }
}

