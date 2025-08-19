package com.showroom.management;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class DressShowroomManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(DressShowroomManagementApplication.class, args);
	}

}
